import { z } from "zod";
import { slugify } from "./opening-import";

export const POST_TYPES = {
  kegiatan: { label: "Kegiatan", path: "/kegiatan", admin: "/admin/kegiatan" },
  artikel: { label: "Artikel", path: "/artikel", admin: "/admin/artikel" },
} as const;

export type PostType = keyof typeof POST_TYPES;

export type Post = {
  id: string;
  type: PostType;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  cover_path: string;
  published_on: string;
};

/** Gambar hanya boleh berasal dari upload atau folder dokumentasi lama. */
export function isImagePath(path: string) {
  return /^\/(media|dokumentasi)\/[\w./-]+$/.test(path) && !path.includes("..");
}

export const postSchema = z
  .object({
    type: z.enum(["kegiatan", "artikel"]),
    title: z.string().trim().min(1, "Judul wajib diisi").max(200),
    slug: z.string().trim().max(200),
    excerpt: z.string().trim().max(400),
    body_md: z.string().trim().min(1, "Isi wajib diisi").max(100_000),
    cover_path: z
      .string()
      .trim()
      .max(300)
      .refine((v) => !v || isImagePath(v), "Foto sampul tidak valid"),
    published_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  })
  .transform((d) => ({ ...d, slug: slugify(d.slug || d.title) }))
  .refine((d) => d.slug.length >= 2, { path: ["slug"], message: "Slug tidak valid" });

/** Mengenali jenis gambar dari isi file, bukan dari nama atau header kiriman. */
export function detectImageMime(b: Uint8Array) {
  const ascii = (start: number, end: number) => String.fromCharCode(...b.slice(start, end));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}
