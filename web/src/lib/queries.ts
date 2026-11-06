import "server-only";
import { sql } from "./db";
import { todayWib } from "./date";
import { PUZZLE_LEVELS, type Activity, type Lesson, type Opening, type OpeningCard, type Puzzle } from "./types";

const dateText = (v: unknown) =>
  v instanceof Date
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(v)
    : String(v);

/* Materi */

export async function listLessons() {
  const rows = await sql`
    select id, slug, chapter, position, title, summary
    from lessons where is_published order by chapter, position`;
  return rows as unknown as Omit<Lesson, "content_md" | "exercises">[];
}

export async function getLesson(slug: string) {
  const rows = await sql`
    select id, slug, chapter, position, title, summary, content_md, exercises
    from lessons where slug = ${slug} and is_published`;
  return (rows[0] as unknown as Lesson) ?? null;
}

/* Opening */

const OPENING_PAGE_SIZE = 24;

export type OpeningFilter = {
  q?: string;
  side?: string;
  level?: string;
  first?: string;
  notes?: string;
  page?: number;
};

/** Pencarian katalog di server. Opening lengkap selalu di atas, lalu jalur terpendek. */
export async function searchOpenings(f: OpeningFilter) {
  const q = f.q?.trim();
  const like = q ? `%${q.replace(/[%_\\]/g, "\\$&").replace(/\s+/g, "%")}%` : "";
  const offset = (Math.max(1, f.page ?? 1) - 1) * OPENING_PAGE_SIZE;

  const rows = await sql`
    select id, slug, name, eco, side, level, first_move, final_fen, is_curated,
           count(*) over()::int as total
    from openings
    where is_published
      ${q ? sql`and (name ilike ${like} or eco ilike ${like})` : sql``}
      ${f.side === "white" || f.side === "black" ? sql`and side = ${f.side}` : sql``}
      ${f.level === "pemula" || f.level === "menengah" ? sql`and level = ${f.level}` : sql``}
      ${f.first === "1.e4" || f.first === "1.d4" ? sql`and first_move = ${f.first}` : sql``}
      ${f.first === "lain" ? sql`and first_move not in ('1.e4', '1.d4')` : sql``}
      ${f.notes === "ada" ? sql`and is_curated` : sql``}
    order by is_curated desc, char_length(pgn), name
    limit ${OPENING_PAGE_SIZE} offset ${offset}`;

  return {
    items: rows as unknown as OpeningCard[],
    total: (rows[0]?.total as number) ?? 0,
  };
}

export async function listCuratedOpeningSlugs() {
  const rows = await sql`select slug from openings where is_published and is_curated`;
  return rows.map((r) => r.slug as string);
}

export async function getOpening(slug: string) {
  const rows = await sql`
    select id, slug, name, eco, side, level, first_move, pgn, move_notes, ideas_md, parent_id, family, is_curated
    from openings where slug = ${slug} and is_published`;
  return (rows[0] as unknown as Opening) ?? null;
}

export async function getOpeningRelations(o: Opening) {
  const [parents, rows] = await Promise.all([
    o.parent_id
      ? sql`select slug, name from openings where id = ${o.parent_id} and is_published`
      : Promise.resolve([]),
    sql`
      select slug, name, count(*) over()::int as total
      from openings
      where is_published and id <> ${o.id} and (family = ${o.family} or parent_id = ${o.id})
      order by is_curated desc, char_length(pgn), name limit 12`,
  ]);
  return {
    parent: (parents[0] as unknown as { slug: string; name: string }) ?? null,
    related: rows as unknown as { slug: string; name: string }[],
    relatedTotal: (rows[0]?.total as number) ?? 0,
  };
}

/* Dokumentasi */

function toActivity(row: Record<string, unknown>) {
  return { ...row, held_on: dateText(row.held_on) } as unknown as Activity;
}

const ACTIVITY_COLUMNS = sql`id, slug, title, category, held_on, location, description_md,
  cover_path, photo_paths, standings, pgn`;

export async function listActivities(limit = 200) {
  const rows = await sql`
    select ${ACTIVITY_COLUMNS} from activities where is_published
    order by held_on desc limit ${limit}`;
  return rows.map(toActivity);
}

export async function getActivity(slug: string) {
  const rows = await sql`select ${ACTIVITY_COLUMNS} from activities where slug = ${slug} and is_published`;
  return rows[0] ? toActivity(rows[0]) : null;
}

/* Puzzle */

export async function getPuzzle(id: string) {
  const rows = await sql`
    select id, fen, moves, rating, themes from puzzles where id = ${id} and is_published`;
  return (rows[0] as unknown as Puzzle) ?? null;
}

/** Puzzle harian untuk tanggal WIB. Dipilih otomatis bila admin atau cron belum mengisi. */
export async function getDailyPuzzle(date = todayWib()) {
  await sql`
    insert into daily_puzzles (date, puzzle_id)
    select ${date}, id from puzzles
    where is_published and rating between 800 and 1600
      and not exists (select 1 from daily_puzzles where date = ${date})
    order by random() limit 1
    on conflict (date) do nothing`;

  const rows = await sql`
    select p.id, p.fen, p.moves, p.rating, p.themes
    from daily_puzzles d join puzzles p on p.id = d.puzzle_id
    where d.date = ${date}`;
  return (rows[0] as unknown as Puzzle) ?? null;
}

export type PuzzleFilter = { theme?: string; level?: string };

/** Puzzle acak sesuai filter. Tanpa filter level, anggota mendapat rating ±200 (PZ-10). */
export async function randomPuzzle(filter: PuzzleFilter, user?: { id: string; puzzleRating: number } | null) {
  const level = PUZZLE_LEVELS.find((l) => l.value === filter.level);
  const min = level?.min ?? (user ? user.puzzleRating - 200 : 0);
  const max = level?.max ?? (user ? user.puzzleRating + 200 : 1400);

  const themeClause = filter.theme ? sql`and themes @> ${[filter.theme]}::text[]` : sql``;
  const unseenClause = user
    ? sql`and not exists (select 1 from puzzle_attempts a where a.puzzle_id = puzzles.id and a.user_id = ${user.id})`
    : sql``;

  const rows = await sql`
    select id, fen, moves, rating, themes from puzzles
    where is_published and rating between ${min} and ${max} ${themeClause} ${unseenClause}
    order by random() limit 1`;
  return (rows[0] as unknown as Puzzle) ?? null;
}

/* Profil */

export async function getProfileData(userId: string) {
  const [lessons, doneRows, openings, attempts, stats] = await Promise.all([
    sql`select id, chapter from lessons where is_published`,
    sql`select lesson_id from lesson_progress where user_id = ${userId}`,
    sql`
      select o.name, o.slug, p.attempts, p.best_streak, p.last_practiced_at
      from opening_progress p join openings o on o.id = p.opening_id
      where p.user_id = ${userId} order by p.last_practiced_at desc limit 20`,
    sql`
      select a.puzzle_id, a.solved, a.used_hint, a.time_ms, a.rating_before, a.rating_after,
             a.created_at, p.rating as puzzle_rating
      from puzzle_attempts a join puzzles p on p.id = a.puzzle_id
      where a.user_id = ${userId} order by a.created_at desc limit 15`,
    sql`
      select count(*)::int as total, count(*) filter (where solved)::int as solved
      from puzzle_attempts where user_id = ${userId}`,
  ]);

  const done = new Set(doneRows.map((r) => r.lesson_id));
  const chapters = new Map<number, { total: number; done: number }>();
  for (const l of lessons) {
    const c = chapters.get(l.chapter) ?? { total: 0, done: 0 };
    c.total += 1;
    if (done.has(l.id)) c.done += 1;
    chapters.set(l.chapter, c);
  }

  return {
    chapters: [...chapters.entries()].sort((a, b) => a[0] - b[0]),
    lessonsDone: done.size,
    lessonsTotal: lessons.length,
    openings,
    attempts,
    stats: stats[0] as unknown as { total: number; solved: number },
  };
}
