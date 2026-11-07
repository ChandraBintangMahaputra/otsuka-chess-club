"use server";

import type { TransactionSql } from "postgres";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CHALLENGE_TTL_MS, TIME_CONTROLS, applyMove, opposite, resultFor, winFor, type Color } from "@/lib/online-game";
import {
  activeGameIdOf,
  colorOf,
  finishGame,
  gameView,
  isTurnOf,
  lockGame,
  movesOf,
  settleIfNeeded,
  type GameRow,
  type GameView,
} from "@/lib/play";

/**
 * Semua aturan main online diperiksa di sini. Pesan Supabase Realtime hanya sinyal
 * "ada perubahan", jadi pesan palsu dari browser tidak bisa mengubah permainan.
 */

const uuid = z.string().uuid();

/** Umur tantangan selalu dihitung dengan jam database, agar tidak terpengaruh jam server aplikasi. */
const TTL = sql`make_interval(secs => ${CHALLENGE_TTL_MS / 1000})`;

type GameResult = { ok: true; game: GameView } | { ok: false; error: string; game?: GameView | null };

async function me() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Silakan masuk dulu");
  return user;
}

export type ChallengeView = {
  id: string;
  user: { id: string; fullName: string; username: string; rating: number };
  timeControl: string;
  expiresAt: number;
};

export type RecentGame = {
  id: string;
  opponent: string;
  outcome: "menang" | "kalah" | "seri";
  delta: number | null;
  endedAt: string;
};

export type LobbyView = {
  me: { id: string; fullName: string; username: string; department: string; rating: number };
  activeGameId: string | null;
  incoming: ChallengeView[];
  outgoing: ChallengeView[];
  recent: RecentGame[];
  serverNow: number;
};

export async function getLobbyAction(): Promise<LobbyView> {
  const user = await me();

  // Permainan yang macet ikut dibereskan saat lobi dibuka.
  const active = await activeGameIdOf(user.id);
  if (active) {
    await sql.begin(async (tx) => {
      const g = await lockGame(tx, active);
      if (g) await settleIfNeeded(tx, g, Date.now());
    });
  }

  const [profile, challenges, recent, activeGameId] = await Promise.all([
    sql`select play_rating, division from users where id = ${user.id}`,
    sql`
      select c.id, c.from_id, c.to_id, c.initial_ms, c.increment_ms,
             (extract(epoch from (c.created_at + ${TTL} - now())) * 1000)::int as remaining_ms,
             u.id as other_id, u.full_name, u.username, u.play_rating
      from challenges c
      join users u on u.id = case when c.from_id = ${user.id} then c.to_id else c.from_id end
      where c.status = 'pending' and c.created_at > now() - ${TTL}
        and (c.from_id = ${user.id} or c.to_id = ${user.id})
      order by c.created_at desc`,
    sql`
      select g.id, g.white_id, g.result, g.ended_at, g.white_rating_before, g.white_rating_after,
             g.black_rating_before, g.black_rating_after, w.full_name as white_name, b.full_name as black_name
      from games g join users w on w.id = g.white_id join users b on b.id = g.black_id
      where g.status = 'finished' and (g.white_id = ${user.id} or g.black_id = ${user.id})
      order by g.ended_at desc limit 8`,
    activeGameIdOf(user.id),
  ]);

  const toView = (c: Record<string, unknown>): ChallengeView => ({
    id: c.id as string,
    user: {
      id: c.other_id as string,
      fullName: c.full_name as string,
      username: c.username as string,
      rating: c.play_rating as number,
    },
    timeControl: `${Math.round((c.initial_ms as number) / 60000)}+${Math.round((c.increment_ms as number) / 1000)}`,
    // Dihitung dengan jam database, lalu diterjemahkan ke jam server aplikasi.
    expiresAt: serverNow + (c.remaining_ms as number),
  });
  const serverNow = Date.now();

  return {
    me: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      department: profile[0]?.division ?? "",
      rating: profile[0]?.play_rating ?? 1200,
    },
    activeGameId,
    incoming: challenges.filter((c) => c.to_id === user.id).map(toView),
    outgoing: challenges.filter((c) => c.from_id === user.id).map(toView),
    recent: recent.map((g) => {
      const color: Color = g.white_id === user.id ? "w" : "b";
      const before = color === "w" ? g.white_rating_before : g.black_rating_before;
      const after = color === "w" ? g.white_rating_after : g.black_rating_after;
      return {
        id: g.id,
        opponent: color === "w" ? g.black_name : g.white_name,
        outcome: resultFor(g.result, color),
        delta: before !== null && after !== null ? after - before : null,
        endedAt: (g.ended_at as Date).toISOString(),
      };
    }),
    serverNow,
  };
}

/** Cadangan bila daftar online tidak tersedia: cari anggota untuk ditantang. */
export async function searchPlayersAction(query: string) {
  const user = await me();
  const q = z.string().trim().min(2).max(60).safeParse(query);
  if (!q.success) return [];
  const like = `%${q.data.replace(/[%_\\]/g, "\\$&")}%`;
  const rows = await sql`
    select id, full_name, username, division, play_rating from users
    where is_active and id <> ${user.id} and (full_name ilike ${like} or username ilike ${like})
    order by full_name limit 10`;
  return rows.map((r) => ({
    id: r.id as string,
    fullName: r.full_name as string,
    username: r.username as string,
    department: r.division as string,
    rating: r.play_rating as number,
    status: "idle" as const,
  }));
}

export async function createChallengeAction(toId: string, timeControlId: string) {
  const user = await me();
  const target = uuid.parse(toId);
  const tc = TIME_CONTROLS.find((t) => t.id === timeControlId);
  if (!tc) return { ok: false as const, error: "Kontrol waktu tidak dikenal" };
  if (target === user.id) return { ok: false as const, error: "Tidak bisa menantang diri sendiri" };

  const [other] = await sql`select id from users where id = ${target} and is_active`;
  if (!other) return { ok: false as const, error: "Pemain tidak ditemukan" };
  if (await activeGameIdOf(user.id)) return { ok: false as const, error: "Selesaikan permainanmu dulu" };
  if (await activeGameIdOf(target)) return { ok: false as const, error: "Pemain itu sedang bermain" };

  const [dup] = await sql`
    select id from challenges
    where status = 'pending' and created_at > now() - ${TTL} and from_id = ${user.id} and to_id = ${target}`;
  if (dup) return { ok: false as const, error: "Tantanganmu masih menunggu jawaban" };

  const [row] = await sql`
    insert into challenges (from_id, to_id, initial_ms, increment_ms)
    values (${user.id}, ${target}, ${tc.initial * 1000}, ${tc.increment * 1000}) returning id`;
  return { ok: true as const, id: row.id as string };
}

export async function cancelChallengeAction(id: string) {
  const user = await me();
  await sql`
    update challenges set status = 'cancelled', responded_at = now()
    where id = ${uuid.parse(id)} and from_id = ${user.id} and status = 'pending'`;
  return { ok: true as const };
}

export async function respondChallengeAction(id: string, accept: boolean) {
  const user = await me();
  const challengeId = uuid.parse(id);

  return sql.begin(async (tx) => {
    const [c] = await tx`
      select *, created_at > now() - ${TTL} as fresh from challenges where id = ${challengeId} for update`;
    if (!c || c.to_id !== user.id || c.status !== "pending") {
      return { ok: false as const, error: "Tantangan sudah tidak berlaku" };
    }
    if (!c.fresh) {
      await tx`update challenges set status = 'cancelled', responded_at = now() where id = ${c.id}`;
      return { ok: false as const, error: "Tantangan sudah kedaluwarsa" };
    }
    if (!accept) {
      await tx`update challenges set status = 'declined', responded_at = now() where id = ${c.id}`;
      return { ok: true as const, gameId: null, fromId: c.from_id as string };
    }

    const busy = await tx`
      select id from games where status = 'active'
        and (white_id in (${c.from_id}, ${c.to_id}) or black_id in (${c.from_id}, ${c.to_id}))`;
    if (busy.length) return { ok: false as const, error: "Salah satu pemain sedang bermain" };

    const fromIsWhite = Math.random() < 0.5;
    const [g] = await tx`
      insert into games (white_id, black_id, initial_ms, increment_ms, white_ms, black_ms)
      values (${fromIsWhite ? c.from_id : c.to_id}, ${fromIsWhite ? c.to_id : c.from_id},
              ${c.initial_ms}, ${c.increment_ms}, ${c.initial_ms}, ${c.initial_ms})
      returning id`;
    await tx`
      update challenges set status = 'accepted', game_id = ${g.id}, responded_at = now() where id = ${c.id}`;
    // Tantangan lain yang masih menunggu untuk kedua pemain dibatalkan.
    await tx`
      update challenges set status = 'cancelled', responded_at = now()
      where status = 'pending' and id <> ${c.id}
        and (from_id in (${c.from_id}, ${c.to_id}) or to_id in (${c.from_id}, ${c.to_id}))`;
    return { ok: true as const, gameId: g.id as string, fromId: c.from_id as string };
  });
}

export async function getGameAction(id: string): Promise<GameResult> {
  const user = await me();
  const gameId = uuid.parse(id);
  await sql.begin(async (tx) => {
    const g = await lockGame(tx, gameId);
    if (g) await settleIfNeeded(tx, g, Date.now());
  });
  const game = await gameView(gameId, user.id);
  return game ? { ok: true, game } : { ok: false, error: "Permainan tidak ditemukan" };
}

/** Kerangka bersama: kunci baris permainan, bereskan waktu habis, lalu jalankan aksi. */
async function withGame(
  id: string,
  run: (tx: TransactionSql, g: GameRow, color: Color, now: number) => Promise<string | null>,
): Promise<GameResult> {
  const user = await me();
  const gameId = uuid.parse(id);
  const error = await sql.begin(async (tx) => {
    const g = await lockGame(tx, gameId);
    if (!g) return "Permainan tidak ditemukan";
    const color = colorOf(g, user.id);
    if (!color) return "Kamu bukan pemain di permainan ini";
    const now = Date.now();
    if (await settleIfNeeded(tx, g, now)) return "Permainan sudah selesai";
    if (g.status !== "active") return "Permainan sudah selesai";
    return run(tx, g, color, now);
  });
  const game = await gameView(gameId, user.id);
  if (error) return { ok: false, error, game };
  return game ? { ok: true, game } : { ok: false, error: "Permainan tidak ditemukan" };
}

export async function playMoveAction(id: string, uci: string, ply: number) {
  const move = z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/).parse(uci);
  const expectedPly = z.number().int().min(0).max(2000).parse(ply);

  return withGame(id, async (tx, g, color, now) => {
    const moves = movesOf(g);
    if (moves.length !== expectedPly) return "Posisi sudah berubah, papan dimuat ulang";
    if (!isTurnOf(g, color)) return "Bukan giliranmu";

    const r = applyMove(
      {
        moves,
        whiteMs: g.white_ms,
        blackMs: g.black_ms,
        incrementMs: g.increment_ms,
        turnStartedAt: g.turn_started_at ? g.turn_started_at.getTime() : null,
      },
      move,
      now,
    );
    if (!r.ok) {
      if (r.outcome) await finishGame(tx, g, r.outcome, now);
      return r.error;
    }

    const next = {
      moves: r.moves.join(" "),
      white_ms: Math.round(r.whiteMs),
      black_ms: Math.round(r.blackMs),
      turn_started_at: r.turnStartedAt ? new Date(r.turnStartedAt) : null,
    };
    if (r.outcome) {
      await finishGame(tx, g, r.outcome, now, next);
      return null;
    }
    await tx`
      update games set moves = ${next.moves}, white_ms = ${next.white_ms}, black_ms = ${next.black_ms},
        turn_started_at = ${next.turn_started_at}, draw_offer = null, last_activity_at = ${new Date(now)}
      where id = ${g.id}`;
    return null;
  });
}

export async function resignAction(id: string) {
  return withGame(id, async (tx, g, color, now) => {
    if (movesOf(g).length < 2) return "Belum ada langkah. Gunakan Batalkan.";
    await finishGame(tx, g, { result: winFor(opposite(color)), termination: "resign" }, now);
    return null;
  });
}

export async function abortAction(id: string) {
  return withGame(id, async (tx, g) => {
    if (movesOf(g).length >= 2) return "Permainan sudah berjalan, gunakan Menyerah";
    await tx`update games set status = 'aborted', ended_at = now(), draw_offer = null where id = ${g.id}`;
    return null;
  });
}

export async function offerDrawAction(id: string) {
  return withGame(id, async (tx, g, color, now) => {
    if (movesOf(g).length < 2) return "Remis bisa ditawarkan setelah permainan dimulai";
    if (g.draw_offer === opposite(color)) {
      await finishGame(tx, g, { result: "1/2-1/2", termination: "agreement" }, now);
      return null;
    }
    await tx`update games set draw_offer = ${color}, last_activity_at = ${new Date(now)} where id = ${g.id}`;
    return null;
  });
}

export async function respondDrawAction(id: string, accept: boolean) {
  return withGame(id, async (tx, g, color, now) => {
    if (g.draw_offer !== opposite(color)) return "Tidak ada tawaran remis";
    if (accept) {
      await finishGame(tx, g, { result: "1/2-1/2", termination: "agreement" }, now);
    } else {
      await tx`update games set draw_offer = null where id = ${g.id}`;
    }
    return null;
  });
}

/**
 * Dipanggil browser saat jam di layar habis. Server memutuskan dengan jamnya sendiri,
 * jadi jam browser yang dimanipulasi tidak berpengaruh.
 */
export async function claimTimeoutAction(id: string): Promise<GameResult> {
  return getGameAction(id);
}
