import "server-only";
import type { Sql, TransactionSql } from "postgres";
import { sql } from "./db";
import type { GameView, PlayerView } from "./play-types";
import { revalidatePath } from "next/cache";
import {
  UNSTARTED_ABORT_MS,
  eloPair,
  liveClocks,
  replay,
  timeoutOutcome,
  turnOf,
  type ClockState,
  type Color,
  type Outcome,
  type Result,
  type Termination,
} from "./online-game";

type Tx = TransactionSql | Sql;

export type GameRow = {
  id: string;
  white_id: string;
  black_id: string;
  initial_ms: number;
  increment_ms: number;
  moves: string;
  white_ms: number;
  black_ms: number;
  turn_started_at: Date | null;
  status: "active" | "finished" | "aborted";
  result: Result | null;
  termination: Termination | null;
  draw_offer: Color | null;
  white_rating_before: number | null;
  black_rating_before: number | null;
  white_rating_after: number | null;
  black_rating_after: number | null;
  last_activity_at: Date;
  created_at: Date;
};

export type { GameView, PlayerView };

export const movesOf = (g: Pick<GameRow, "moves">) => (g.moves ? g.moves.split(" ") : []);

export function clockState(g: GameRow): ClockState {
  return {
    moves: movesOf(g),
    whiteMs: g.white_ms,
    blackMs: g.black_ms,
    incrementMs: g.increment_ms,
    turnStartedAt: g.turn_started_at ? g.turn_started_at.getTime() : null,
  };
}

export async function lockGame(tx: Tx, id: string) {
  const [g] = await tx`select * from games where id = ${id} for update`;
  return (g as unknown as GameRow) ?? null;
}

/** Menyelesaikan permainan dan memperbarui rating kedua pemain dalam transaksi yang sama. */
export async function finishGame(tx: Tx, g: GameRow, outcome: Outcome, now: number, extra?: Partial<GameRow>) {
  const players = await tx`
    select id, play_rating from users where id in (${g.white_id}, ${g.black_id}) for update`;
  const rating = (id: string) => players.find((p) => p.id === id)?.play_rating ?? 1200;
  const before = { white: rating(g.white_id), black: rating(g.black_id) };
  const after = eloPair(before.white, before.black, outcome.result);

  // Jam disimpan dalam keadaan akhir, sehingga kalah waktu tampil 0:00.
  const live = liveClocks(clockState(g), now);
  extra = { white_ms: Math.round(live.w), black_ms: Math.round(live.b), ...extra };

  await tx`update users set play_rating = ${after.white} where id = ${g.white_id}`;
  await tx`update users set play_rating = ${after.black} where id = ${g.black_id}`;
  await tx`
    update games set
      status = 'finished', result = ${outcome.result}, termination = ${outcome.termination},
      draw_offer = null, ended_at = ${new Date(now)}, last_activity_at = ${new Date(now)},
      white_ms = ${extra?.white_ms ?? g.white_ms}, black_ms = ${extra?.black_ms ?? g.black_ms},
      moves = ${extra?.moves ?? g.moves}, turn_started_at = ${extra?.turn_started_at ?? g.turn_started_at},
      white_rating_before = ${before.white}, black_rating_before = ${before.black},
      white_rating_after = ${after.white}, black_rating_after = ${after.black}
    where id = ${g.id}`;
  revalidatePath("/peringkat");
}

/**
 * Pengecekan yang dijalankan setiap kali permainan dibaca atau diubah:
 * kalah waktu dan pembatalan permainan yang tidak pernah dimulai.
 * Tidak butuh cron, sehingga tidak ada pesan atau proses berjalan di latar.
 */
export async function settleIfNeeded(tx: Tx, g: GameRow, now: number) {
  if (g.status !== "active") return false;
  const timeout = timeoutOutcome(clockState(g), now);
  if (timeout) {
    await finishGame(tx, g, timeout, now);
    return true;
  }
  if (movesOf(g).length < 2 && now - g.last_activity_at.getTime() > UNSTARTED_ABORT_MS) {
    await tx`
      update games set status = 'aborted', ended_at = ${new Date(now)}, draw_offer = null where id = ${g.id}`;
    return true;
  }
  return false;
}

async function playersOf(ids: string[]) {
  const rows = await sql`
    select id, full_name, username, division, play_rating from users where id = any(${ids}::uuid[])`;
  return new Map(
    rows.map((r) => [
      r.id as string,
      {
        id: r.id,
        fullName: r.full_name,
        username: r.username,
        department: r.division,
        rating: r.play_rating,
      } as PlayerView,
    ]),
  );
}

export async function gameView(id: string, viewerId: string | null): Promise<GameView | null> {
  const [row] = await sql`select * from games where id = ${id}`;
  if (!row) return null;
  const g = row as unknown as GameRow;
  const now = Date.now();
  const players = await playersOf([g.white_id, g.black_id]);

  const moves = movesOf(g);
  const chess = replay(moves);
  const history = chess.history({ verbose: true });
  const last = history.at(-1);
  const finished = g.status === "finished";

  return {
    id: g.id,
    white: players.get(g.white_id)!,
    black: players.get(g.black_id)!,
    myColor: viewerId === g.white_id ? "w" : viewerId === g.black_id ? "b" : null,
    moves,
    sanMoves: history.map((m) => m.san),
    fen: chess.fen(),
    lastMove: last ? { from: last.from, to: last.to, san: last.san } : null,
    status: g.status,
    result: g.result,
    termination: g.termination,
    drawOffer: g.draw_offer,
    clocks: g.status === "active" ? liveClocks(clockState(g), now) : { w: g.white_ms, b: g.black_ms },
    clockRunning: g.status === "active" && g.turn_started_at !== null,
    initialMs: g.initial_ms,
    incrementMs: g.increment_ms,
    ratingChange:
      finished && g.white_rating_before !== null
        ? {
            w: g.white_rating_after! - g.white_rating_before,
            b: g.black_rating_after! - g.black_rating_before!,
          }
        : null,
    serverNow: now,
  };
}

export async function activeGameIdOf(userId: string) {
  const rows = await sql`
    select id from games where status = 'active' and (white_id = ${userId} or black_id = ${userId})
    order by created_at desc limit 1`;
  return (rows[0]?.id as string) ?? null;
}

export const colorOf = (g: GameRow, userId: string): Color | null =>
  userId === g.white_id ? "w" : userId === g.black_id ? "b" : null;

export const isTurnOf = (g: GameRow, color: Color) => turnOf(movesOf(g).length) === color;
