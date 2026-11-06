import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import postgres from "postgres";
import sharp from "sharp";
import { z } from "zod";
import { todayWib } from "../src/lib/date.ts";
import { detectImageMime, postSchema } from "../src/lib/post.ts";

/**
 * Server MCP untuk mengelola Artikel Otsuka Chess lewat stdio.
 * stdout dipakai protokol MCP, jadi log hanya boleh ke stderr.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL belum diisi di web/.env.local");

const sql = postgres(url.replace(/[?&]pgbouncer=[^&]*/, ""), {
  prepare: false,
  max: 2,
  idle_timeout: 30,
  onnotice: () => {},
});

const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const COLUMNS = sql`id, slug, title, excerpt, cover_path, published_on::text as date, is_published as published`;

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const ok = (data: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Kesalahan yang bisa diperbaiki pemanggil dikembalikan sebagai hasil tool, bukan crash. */
function guarded<A>(run: (args: A) => Promise<ToolResult>) {
  return async (args: A) => {
    try {
      return await run(args);
    } catch (e) {
      if ((e as { code?: string }).code === "23505") return fail("Slug sudah dipakai artikel lain.");
      console.error(e);
      return fail(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
  };
}

/** Halaman publik di-cache, jadi web diminta memperbarui cache setelah data berubah. */
async function refreshSite() {
  try {
    const res = await fetch(`${SITE_URL}/api/revalidate/artikel`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? "Halaman publik diperbarui." : `Web menolak pembaruan cache (HTTP ${res.status}).`;
  } catch {
    return `Web di ${SITE_URL} tidak terjangkau, halaman publik berubah paling lambat 1 jam lagi.`;
  }
}

function validate(input: {
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  cover_path: string;
  date: string;
}) {
  const parsed = postSchema.safeParse({
    type: "artikel",
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    body_md: input.body_md,
    cover_path: input.cover_path,
    published_on: input.date,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data artikel tidak valid.");
  return parsed.data;
}

const server = new McpServer({ name: "otsuka-artikel", version: "1.0.0" });

server.registerTool(
  "list_articles",
  {
    title: "Daftar artikel",
    description: "Menampilkan artikel Otsuka Chess, terbaru di atas, tanpa isi lengkap.",
    inputSchema: {
      status: z.enum(["semua", "terbit", "draf"]).default("semua").describe("Filter status"),
      search: z.string().max(100).optional().describe("Kata kunci pada judul"),
      limit: z.number().int().min(1).max(100).default(30),
    },
    annotations: { readOnlyHint: true },
  },
  guarded(async ({ status, search, limit }) => {
    const like = `%${(search ?? "").replace(/[%_\\]/g, "\\$&")}%`;
    const rows = await sql`
      select ${COLUMNS} from posts
      where type = 'artikel'
        ${status === "terbit" ? sql`and is_published` : status === "draf" ? sql`and not is_published` : sql``}
        ${search ? sql`and title ilike ${like}` : sql``}
      order by published_on desc, title limit ${limit}`;
    return ok(rows);
  }),
);

server.registerTool(
  "get_article",
  {
    title: "Baca artikel",
    description: "Mengambil satu artikel lengkap dengan isi Markdown berdasarkan slug.",
    inputSchema: { slug: z.string().min(1).max(200) },
    annotations: { readOnlyHint: true },
  },
  guarded(async ({ slug }) => {
    const [row] = await sql`
      select ${COLUMNS}, body_md from posts where type = 'artikel' and slug = ${slug}`;
    return row ? ok(row) : fail(`Artikel dengan slug ${slug} tidak ditemukan.`);
  }),
);

server.registerTool(
  "create_article",
  {
    title: "Buat artikel",
    description:
      "Membuat artikel baru. Tersimpan sebagai draf kecuali publish true. Isi memakai Markdown, " +
      'dan papan catur ditulis ::board{fen="..." arrows="e2e4"} di baris tersendiri.',
    inputSchema: {
      title: z.string().min(1).max(200),
      body_md: z.string().min(1).describe("Isi artikel dalam Markdown"),
      excerpt: z.string().max(400).default("").describe("Ringkasan untuk kartu daftar"),
      slug: z.string().max(200).default("").describe("Kosongkan untuk dibuat dari judul"),
      date: z.string().optional().describe("YYYY-MM-DD, default hari ini WIB"),
      cover_path: z.string().max(300).default("").describe("Path dari upload_image"),
      publish: z.boolean().default(false).describe("true untuk langsung tampil di website"),
    },
  },
  guarded(async ({ publish, date, ...input }) => {
    const d = validate({ ...input, date: date ?? todayWib() });
    const [row] = await sql`
      insert into posts (type, slug, title, excerpt, body_md, cover_path, published_on, is_published)
      values ('artikel', ${d.slug}, ${d.title}, ${d.excerpt}, ${d.body_md}, ${d.cover_path},
              ${d.published_on}, ${publish})
      returning ${COLUMNS}`;
    return ok({ article: row, url: `${SITE_URL}/artikel/${d.slug}`, site: await refreshSite() });
  }),
);

server.registerTool(
  "update_article",
  {
    title: "Ubah artikel",
    description: "Mengubah artikel berdasarkan slug. Hanya kolom yang dikirim yang berubah.",
    inputSchema: {
      slug: z.string().min(1).max(200).describe("Slug artikel yang diubah"),
      new_slug: z.string().max(200).optional(),
      title: z.string().min(1).max(200).optional(),
      body_md: z.string().min(1).optional(),
      excerpt: z.string().max(400).optional(),
      date: z.string().optional().describe("YYYY-MM-DD"),
      cover_path: z.string().max(300).optional(),
      publish: z.boolean().optional().describe("true terbitkan, false jadikan draf"),
    },
  },
  guarded(async (a) => {
    const [cur] = await sql`
      select id, slug, title, excerpt, body_md, cover_path, published_on::text as date, is_published
      from posts where type = 'artikel' and slug = ${a.slug}`;
    if (!cur) return fail(`Artikel dengan slug ${a.slug} tidak ditemukan.`);

    const d = validate({
      title: a.title ?? cur.title,
      slug: a.new_slug ?? cur.slug,
      excerpt: a.excerpt ?? cur.excerpt,
      body_md: a.body_md ?? cur.body_md,
      cover_path: a.cover_path ?? cur.cover_path,
      date: a.date ?? cur.date,
    });
    const [row] = await sql`
      update posts set slug = ${d.slug}, title = ${d.title}, excerpt = ${d.excerpt}, body_md = ${d.body_md},
        cover_path = ${d.cover_path}, published_on = ${d.published_on},
        is_published = ${a.publish ?? cur.is_published}, updated_at = now()
      where id = ${cur.id} returning ${COLUMNS}`;
    return ok({ article: row, site: await refreshSite() });
  }),
);

server.registerTool(
  "delete_article",
  {
    title: "Hapus artikel",
    description: "Menghapus artikel secara permanen. Tidak bisa dibatalkan.",
    inputSchema: { slug: z.string().min(1).max(200) },
    annotations: { destructiveHint: true },
  },
  guarded(async ({ slug }) => {
    const rows = await sql`delete from posts where type = 'artikel' and slug = ${slug} returning title`;
    if (!rows.length) return fail(`Artikel dengan slug ${slug} tidak ditemukan.`);
    return ok({ deleted: rows[0].title, site: await refreshSite() });
  }),
);

server.registerTool(
  "upload_image",
  {
    title: "Upload gambar",
    description:
      "Mengunggah foto dari komputer ini (JPG, PNG, WebP). Foto dikecilkan ke lebar maksimal 1600 px. " +
      "Pakai path hasilnya untuk cover_path atau di isi: ![keterangan](/media/...).",
    inputSchema: { file_path: z.string().min(1).describe("Path file di komputer") },
  },
  guarded(async ({ file_path }) => {
    const info = await stat(file_path);
    if (info.size > MAX_IMAGE_BYTES) return fail("File lebih besar dari 25 MB.");
    const source = await readFile(file_path);
    if (!detectImageMime(source)) return fail("Format harus JPG, PNG, atau WebP.");

    const bytes = await sharp(source)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const [row] = await sql`
      insert into media (mime, bytes, size) values ('image/webp', ${bytes}, ${bytes.length}) returning id`;
    return ok({ path: `/media/${row.id}`, size_kb: Math.round(bytes.length / 1024) });
  }),
);

await server.connect(new StdioServerTransport());
