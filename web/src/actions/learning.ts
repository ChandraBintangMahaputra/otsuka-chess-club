"use server";

import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { nextRating } from "@/lib/elo";
import { randomPuzzle, type PuzzleFilter } from "@/lib/queries";
import { attemptSchema } from "@/lib/validation";

/** Tamu tidak tersimpan di server, jadi action ini hanya berlaku untuk anggota. */

export async function nextPuzzleAction(filter: PuzzleFilter) {
  const parsed = z
    .object({ theme: z.string().max(40).optional(), level: z.string().max(20).optional() })
    .parse(filter);
  const user = await getCurrentUser();
  return randomPuzzle(parsed, user);
}

export async function recordAttemptAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return null;
  const d = attemptSchema.parse(input);

  return sql.begin(async (tx) => {
    const [u] = await tx`select puzzle_rating from users where id = ${user.id} for update`;
    const [p] = await tx`select rating from puzzles where id = ${d.puzzleId}`;
    if (!p) return null;

    const before: number = u.puzzle_rating;
    const after = nextRating(before, p.rating, d.solved, d.usedHint);

    // Unique (user_id, puzzle_id): percobaan ulang tidak mengubah rating.
    const inserted = await tx`
      insert into puzzle_attempts (user_id, puzzle_id, solved, used_hint, time_ms, rating_before, rating_after)
      values (${user.id}, ${d.puzzleId}, ${d.solved}, ${d.usedHint}, ${d.timeMs}, ${before}, ${after})
      on conflict (user_id, puzzle_id) do nothing returning id`;
    if (!inserted.length) return { ratingBefore: before, ratingAfter: before, counted: false };

    await tx`update users set puzzle_rating = ${after} where id = ${user.id}`;
    return { ratingBefore: before, ratingAfter: after, counted: true };
  });
}

export async function completeLessonAction(lessonId: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  const id = z.string().uuid().parse(lessonId);
  await sql`
    insert into lesson_progress (user_id, lesson_id) values (${user.id}, ${id})
    on conflict do nothing`;
  return true;
}

/** Progres tamu dari localStorage digabung ke akun (AK-12). */
export async function mergeGuestProgressAction(lessonIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return false;
  const ids = z.array(z.string().uuid()).max(200).parse(lessonIds);
  if (!ids.length) return true;
  await sql`
    insert into lesson_progress (user_id, lesson_id)
    select ${user.id}, l.id from lessons l where l.id = any(${ids}::uuid[])
    on conflict do nothing`;
  return true;
}

export async function recordOpeningPracticeAction(openingId: string, streak: number) {
  const user = await getCurrentUser();
  if (!user) return false;
  const id = z.string().uuid().parse(openingId);
  const best = z.number().int().min(0).max(1000).parse(streak);
  await sql`
    insert into opening_progress (user_id, opening_id, attempts, best_streak)
    values (${user.id}, ${id}, 1, ${best})
    on conflict (user_id, opening_id) do update set
      attempts = opening_progress.attempts + 1,
      best_streak = greatest(opening_progress.best_streak, ${best}),
      last_practiced_at = now()`;
  return true;
}
