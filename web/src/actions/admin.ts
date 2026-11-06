"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Chess } from "chess.js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { familyOf } from "@/lib/opening-import";
import { isImagePath } from "@/lib/post";
import { PuzzleGame } from "@/lib/puzzle-engine";
import { normalizeSan } from "@/lib/san";

export type AdminState = { error?: string; success?: string; redirectTo?: string } | null;

const uuid = z.string().uuid();
const slug = z.string().trim().regex(/^[a-z0-9-]{2,200}$/, "Slug: huruf kecil, angka, dan tanda hubung");
const text = (max = 200) => z.string().trim().min(1, "Wajib diisi").max(max);
const flag = (form: FormData, key: string) => form.get(key) === "on";
const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Data tidak valid";
const idOf = (form: FormData) => {
  const raw = form.get("id");
  return typeof raw === "string" && raw ? uuid.parse(raw) : null;
};

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

function refreshPublic(section: "belajar" | "opening" | "dokumentasi") {
  revalidatePath(`/${section}`);
  revalidatePath(`/${section}/[slug]`, "page");
  if (section === "dokumentasi") revalidatePath("/");
}

/* Materi */

const exerciseSchema = z.array(
  z.object({
    fen: z.string(),
    prompt: z.string().min(1),
    answers: z.array(z.string().min(1)).min(1),
    explanation: z.string().min(1),
    hint: z.string().optional(),
  }),
);

function checkExercises(raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    throw new Error("Latihan bukan JSON yang valid");
  }
  const exercises = exerciseSchema.parse(parsed);
  exercises.forEach((ex, i) => {
    let legal: string[];
    try {
      legal = new Chess(ex.fen).moves().map(normalizeSan);
    } catch {
      throw new Error(`Latihan ${i + 1}: FEN tidak valid`);
    }
    for (const a of ex.answers) {
      if (!legal.includes(normalizeSan(a))) throw new Error(`Latihan ${i + 1}: jawaban ${a} bukan langkah legal`);
    }
  });
  return exercises;
}

export async function saveLessonAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const d = z
      .object({
        slug,
        title: text(),
        summary: z.string().trim().max(300),
        chapter: z.coerce.number().int().min(1).max(50),
        position: z.coerce.number().int().min(1).max(100),
        content_md: z.string().max(50_000),
      })
      .parse(Object.fromEntries(form));
    const exercises = checkExercises(String(form.get("exercises") ?? ""));
    const id = idOf(form);
    const published = flag(form, "is_published");

    if (id) {
      await sql`
        update lessons set slug = ${d.slug}, title = ${d.title}, summary = ${d.summary},
          chapter = ${d.chapter}, position = ${d.position}, content_md = ${d.content_md},
          exercises = ${sql.json(exercises as never)}, is_published = ${published}, updated_at = now()
        where id = ${id}`;
    } else {
      await sql`
        insert into lessons (slug, title, summary, chapter, position, content_md, exercises, is_published)
        values (${d.slug}, ${d.title}, ${d.summary}, ${d.chapter}, ${d.position}, ${d.content_md},
                ${sql.json(exercises as never)}, ${published})`;
    }
  } catch (e) {
    return { error: messageOf(e) };
  }
  refreshPublic("belajar");
  return { success: "Materi tersimpan.", redirectTo: "/admin/materi" };
}

/* Opening */

export async function saveOpeningAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const d = z
      .object({
        slug,
        name: text(),
        eco: z.string().trim().regex(/^[A-E]\d\d$/, "ECO harus A00 sampai E99"),
        side: z.enum(["white", "black"]),
        level: z.enum(["pemula", "menengah"]),
        pgn: text(5000),
        ideas_md: z.string().max(20_000),
      })
      .parse(Object.fromEntries(form));

    const game = new Chess();
    try {
      game.loadPgn(d.pgn);
    } catch {
      return { error: "PGN tidak valid" };
    }
    const history = game.history();
    if (!history.length) return { error: "PGN kosong" };
    const firstMove = `1.${history[0]}`;
    const finalFen = game.fen();
    const family = familyOf(d.name);

    let notes: unknown;
    try {
      notes = JSON.parse(String(form.get("move_notes") || "{}"));
    } catch {
      return { error: "Catatan langkah bukan JSON yang valid" };
    }
    const moveNotes = z.record(z.string(), z.string()).parse(notes);
    const curated = Object.keys(moveNotes).length > 0;

    const parentRaw = String(form.get("parent_id") ?? "");
    const parent = parentRaw ? uuid.parse(parentRaw) : null;
    const id = idOf(form);
    const published = flag(form, "is_published");

    if (id) {
      await sql`
        update openings set slug = ${d.slug}, name = ${d.name}, eco = ${d.eco}, side = ${d.side},
          level = ${d.level}, first_move = ${firstMove}, pgn = ${d.pgn}, move_notes = ${sql.json(moveNotes)},
          ideas_md = ${d.ideas_md}, parent_id = ${parent}, is_published = ${published},
          final_fen = ${finalFen}, family = ${family}, is_curated = ${curated}
        where id = ${id}`;
    } else {
      await sql`
        insert into openings (slug, name, eco, side, level, first_move, pgn, move_notes, ideas_md, parent_id,
                              is_published, final_fen, family, is_curated)
        values (${d.slug}, ${d.name}, ${d.eco}, ${d.side}, ${d.level}, ${firstMove}, ${d.pgn},
                ${sql.json(moveNotes)}, ${d.ideas_md}, ${parent}, ${published}, ${finalFen}, ${family}, ${curated})`;
    }
  } catch (e) {
    return { error: messageOf(e) };
  }
  refreshPublic("opening");
  return { success: "Opening tersimpan.", redirectTo: "/admin/opening" };
}

/* Dokumentasi */

export async function saveActivityAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const d = z
      .object({
        slug,
        title: text(),
        category: z.enum(["turnamen", "latihan", "gathering", "lainnya"]),
        held_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
        location: z.string().trim().max(200),
        description_md: z.string().max(20_000),
        cover_path: z.string().trim().max(300),
      })
      .parse(Object.fromEntries(form));

    const photos = String(form.get("photo_paths") ?? "")
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of [...photos, d.cover_path].filter(Boolean)) {
      if (!isImagePath(p)) return { error: `Path foto tidak valid: ${p}` };
    }

    let standings: unknown = null;
    const standingsRaw = String(form.get("standings") ?? "").trim();
    if (standingsRaw) {
      try {
        standings = z
          .array(z.object({ name: z.string().min(1), points: z.number() }))
          .parse(JSON.parse(standingsRaw));
      } catch {
        return { error: 'Peringkat harus JSON, contoh [{"name":"Budi","points":4.5}]' };
      }
    }

    const pgn = String(form.get("pgn") ?? "").trim() || null;
    if (pgn) {
      try {
        new Chess().loadPgn(pgn);
      } catch {
        return { error: "PGN tidak valid" };
      }
    }

    const id = idOf(form);
    const published = flag(form, "is_published");
    const cover = d.cover_path || photos[0] || "";
    const standingsValue = standings ? sql.json(standings as never) : null;

    if (id) {
      await sql`
        update activities set slug = ${d.slug}, title = ${d.title}, category = ${d.category},
          held_on = ${d.held_on}, location = ${d.location}, description_md = ${d.description_md},
          cover_path = ${cover}, photo_paths = ${photos}, standings = ${standingsValue}, pgn = ${pgn},
          is_published = ${published}
        where id = ${id}`;
    } else {
      await sql`
        insert into activities (slug, title, category, held_on, location, description_md, cover_path,
                                photo_paths, standings, pgn, is_published)
        values (${d.slug}, ${d.title}, ${d.category}, ${d.held_on}, ${d.location}, ${d.description_md},
                ${cover}, ${photos}, ${standingsValue}, ${pgn}, ${published})`;
    }
  } catch (e) {
    return { error: messageOf(e) };
  }
  refreshPublic("dokumentasi");
  return { success: "Dokumentasi tersimpan.", redirectTo: "/admin/dokumentasi" };
}

/* Puzzle */

function playable(fen: string, moves: string) {
  try {
    const g = new PuzzleGame({ fen, moves });
    while (!g.isComplete) g.advance();
    return g.solution.length >= 2;
  } catch {
    return false;
  }
}

export async function savePuzzleAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  try {
    const d = z
      .object({
        fen: text(120),
        moves: text(400),
        rating: z.coerce.number().int().min(100).max(4000),
        themes: z.string().max(300),
      })
      .parse(Object.fromEntries(form));
    if (!playable(d.fen, d.moves)) return { error: "FEN atau langkah UCI tidak bisa dimainkan" };

    const themes = d.themes.split(/[\s,]+/).filter(Boolean);
    const id = idOf(form);
    const published = flag(form, "is_published");

    if (id) {
      await sql`
        update puzzles set fen = ${d.fen}, moves = ${d.moves}, rating = ${d.rating},
          themes = ${themes}, is_published = ${published}
        where id = ${id}`;
    } else {
      await sql`
        insert into puzzles (fen, moves, rating, themes, source, is_published)
        values (${d.fen}, ${d.moves}, ${d.rating}, ${themes}, 'klub', ${published})`;
    }
  } catch (e) {
    return { error: messageOf(e) };
  }
  revalidatePath("/puzzle/[id]", "page");
  return { success: "Puzzle tersimpan.", redirectTo: "/admin/puzzle" };
}

/** AD-04: impor CSV berformat Lichess. Puzzle yang sudah ada otomatis dilewati. */
export async function importPuzzlesAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file CSV" };

  const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(",") ?? [];
  const col = (name: string) => header.indexOf(name);
  const [cId, cFen, cMoves, cRating, cThemes] = ["PuzzleId", "FEN", "Moves", "Rating", "Themes"].map(col);
  if ([cId, cFen, cMoves, cRating, cThemes].some((c) => c < 0)) {
    return { error: "Header CSV harus memuat PuzzleId, FEN, Moves, Rating, Themes" };
  }

  const rows = [];
  let skipped = 0;
  for (const line of lines) {
    const c = line.split(",");
    const rating = Number(c[cRating]);
    if (!Number.isInteger(rating) || !playable(c[cFen], c[cMoves])) {
      skipped += 1;
      continue;
    }
    rows.push({
      fen: c[cFen],
      moves: c[cMoves],
      rating,
      themes: (c[cThemes] ?? "").split(" ").filter(Boolean),
      source: "lichess",
      source_id: c[cId],
    });
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const result = await sql`
      insert into puzzles ${sql(rows.slice(i, i + 500))}
      on conflict (source, source_id) do nothing returning id`;
    inserted += result.length;
  }
  return { success: `${inserted} puzzle ditambahkan, ${rows.length - inserted} sudah ada, ${skipped} baris tidak valid.` };
}

/** AD-08: mengatur puzzle harian untuk tanggal tertentu. */
export async function setDailyPuzzleAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = z
    .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), puzzle_id: uuid })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Tanggal atau ID puzzle tidak valid" };
  const { date, puzzle_id } = parsed.data;

  const exists = await sql`select 1 from puzzles where id = ${puzzle_id}`;
  if (!exists.length) return { error: "Puzzle tidak ditemukan" };
  await sql`
    insert into daily_puzzles (date, puzzle_id) values (${date}, ${puzzle_id})
    on conflict (date) do update set puzzle_id = excluded.puzzle_id`;
  revalidatePath("/");
  return { success: `Puzzle harian ${date} tersimpan.` };
}

/* Hapus konten */

export async function deleteContentAction(kind: "lesson" | "opening" | "activity" | "puzzle", id: string) {
  await requireAdmin();
  const target = uuid.parse(id);
  if (kind === "lesson") {
    await sql`delete from lessons where id = ${target}`;
    refreshPublic("belajar");
  } else if (kind === "opening") {
    await sql`delete from openings where id = ${target}`;
    refreshPublic("opening");
  } else if (kind === "activity") {
    await sql`delete from activities where id = ${target}`;
    refreshPublic("dokumentasi");
  } else {
    await sql`delete from puzzles where id = ${target}`;
  }
}

/* Anggota */

export async function setRoleAction(userId: string, role: "member" | "admin") {
  const admin = await requireAdmin();
  const id = uuid.parse(userId);
  if (id === admin.id) return; // Admin tidak bisa mencabut perannya sendiri.
  await sql`update users set role = ${z.enum(["member", "admin"]).parse(role)} where id = ${id}`;
  revalidatePath("/admin/anggota");
}

export async function setActiveAction(userId: string, active: boolean) {
  const admin = await requireAdmin();
  const id = uuid.parse(userId);
  if (id === admin.id) return;
  await sql`update users set is_active = ${active} where id = ${id}`;
  if (!active) await sql`delete from sessions where user_id = ${id}`;
  revalidatePath("/admin/anggota");
}

/** AK-10: password sementara hanya ditampilkan sekali kepada admin. */
export async function resetPasswordAction(userId: string) {
  await requireAdmin();
  const id = uuid.parse(userId);
  const temporary = `Otsuka-${randomBytes(5).toString("hex")}9`;
  const hash = await bcrypt.hash(temporary, 12);
  await sql`
    update users set password_hash = ${hash}, must_change_password = true,
      failed_login_count = 0, locked_until = null
    where id = ${id}`;
  await sql`delete from sessions where user_id = ${id}`;
  return temporary;
}

function messageOf(e: unknown) {
  if (e instanceof z.ZodError) return firstError(e);
  if (isUniqueViolation(e)) return "Slug sudah dipakai";
  if (e instanceof Error && e.message.startsWith("Latihan")) return e.message;
  console.error(e);
  return "Gagal menyimpan. Coba lagi.";
}
