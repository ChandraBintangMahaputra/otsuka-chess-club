import { Chess } from "chess.js";
import { uciToMove } from "./puzzle-engine";

/** Aturan main online yang dipakai server (sumber kebenaran) dan browser (tampilan). */

export const TIME_CONTROLS = [
  { id: "3+2", label: "Blitz 3+2", initial: 180, increment: 2 },
  { id: "5+3", label: "Blitz 5+3", initial: 300, increment: 3 },
  { id: "10+0", label: "Rapid 10+0", initial: 600, increment: 0 },
  { id: "15+10", label: "Rapid 15+10", initial: 900, increment: 10 },
] as const;

export type TimeControlId = (typeof TIME_CONTROLS)[number]["id"];

export const timeControlLabel = (initialMs: number, incrementMs: number) =>
  `${Math.round(initialMs / 60000)}+${Math.round(incrementMs / 1000)}`;

/** Tantangan kedaluwarsa bila tidak dijawab. */
export const CHALLENGE_TTL_MS = 60_000;
/** Permainan dibatalkan otomatis bila salah satu pemain belum melangkah selama ini. */
export const UNSTARTED_ABORT_MS = 120_000;
export const RATING_K = 32;

export type Color = "w" | "b";
export type Result = "1-0" | "0-1" | "1/2-1/2";
export type Termination =
  | "checkmate"
  | "resign"
  | "timeout"
  | "timeout-draw"
  | "stalemate"
  | "insufficient"
  | "threefold"
  | "fifty"
  | "agreement";

export type Outcome = { result: Result; termination: Termination };

export const TERMINATION_LABEL: Record<Termination, string> = {
  checkmate: "skakmat",
  resign: "menyerah",
  timeout: "waktu habis",
  "timeout-draw": "waktu habis, materi lawan tidak cukup untuk mat",
  stalemate: "pat",
  insufficient: "materi tidak cukup",
  threefold: "pengulangan tiga kali",
  fifty: "aturan 50 langkah",
  agreement: "kesepakatan remis",
};

export type ClockState = {
  moves: string[];
  whiteMs: number;
  blackMs: number;
  incrementMs: number;
  /** Waktu (epoch ms) giliran sekarang dimulai. Null selama jam belum berjalan. */
  turnStartedAt: number | null;
};

export const turnOf = (ply: number): Color => (ply % 2 === 0 ? "w" : "b");
export const opposite = (c: Color): Color => (c === "w" ? "b" : "w");
export const winFor = (c: Color): Result => (c === "w" ? "1-0" : "0-1");

export function replay(moves: string[]) {
  const chess = new Chess();
  for (const m of moves) chess.move(uciToMove(m));
  return chess;
}

/** Sisa waktu kedua pemain pada saat `now`. Hanya sisi yang sedang melangkah yang berkurang. */
export function liveClocks(s: ClockState, now: number) {
  let white = s.whiteMs;
  let black = s.blackMs;
  if (s.turnStartedAt !== null) {
    const elapsed = Math.max(0, now - s.turnStartedAt);
    if (turnOf(s.moves.length) === "w") white -= elapsed;
    else black -= elapsed;
  }
  return { w: Math.max(0, white), b: Math.max(0, black) };
}

/** Apakah sisi ini masih punya materi untuk memberi mat (aturan FIDE untuk waktu habis). */
export function canMate(chess: Chess, color: Color) {
  let minors = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq || sq.color !== color || sq.type === "k") continue;
      if (sq.type === "p" || sq.type === "r" || sq.type === "q") return true;
      minors += 1;
    }
  }
  return minors >= 2;
}

export function outcomeAfterMove(chess: Chess, mover: Color): Outcome | null {
  if (chess.isCheckmate()) return { result: winFor(mover), termination: "checkmate" };
  if (chess.isStalemate()) return { result: "1/2-1/2", termination: "stalemate" };
  if (chess.isInsufficientMaterial()) return { result: "1/2-1/2", termination: "insufficient" };
  if (chess.isThreefoldRepetition()) return { result: "1/2-1/2", termination: "threefold" };
  if (chess.isDrawByFiftyMoves()) return { result: "1/2-1/2", termination: "fifty" };
  return null;
}

export function timeoutOutcome(s: ClockState, now: number): Outcome | null {
  if (s.turnStartedAt === null) return null;
  const side = turnOf(s.moves.length);
  if (liveClocks(s, now)[side] > 0) return null;
  const winner = opposite(side);
  return canMate(replay(s.moves), winner)
    ? { result: winFor(winner), termination: "timeout" }
    : { result: "1/2-1/2", termination: "timeout-draw" };
}

export type MoveResult =
  | {
      ok: true;
      moves: string[];
      san: string;
      whiteMs: number;
      blackMs: number;
      turnStartedAt: number | null;
      outcome: Outcome | null;
    }
  | { ok: false; error: string; outcome?: Outcome };

/**
 * Menerapkan langkah dengan jam Fischer. Jam baru berjalan setelah Hitam melangkah
 * pertama kali, sehingga pemain yang terlambat masuk tidak langsung kalah waktu.
 */
export function applyMove(s: ClockState, uci: string, now: number): MoveResult {
  const timeout = timeoutOutcome(s, now);
  if (timeout) return { ok: false, error: "Waktu habis", outcome: timeout };

  const chess = replay(s.moves);
  const mover = turnOf(s.moves.length);
  let move;
  try {
    move = chess.move(uciToMove(uci));
  } catch {
    return { ok: false, error: "Langkah tidak sah" };
  }

  const clocks = liveClocks(s, now);
  let whiteMs = clocks.w;
  let blackMs = clocks.b;
  if (s.turnStartedAt !== null) {
    if (mover === "w") whiteMs += s.incrementMs;
    else blackMs += s.incrementMs;
  }

  const moves = [...s.moves, move.from + move.to + (move.promotion ?? "")];
  return {
    ok: true,
    moves,
    san: move.san,
    whiteMs,
    blackMs,
    turnStartedAt: moves.length >= 2 ? now : null,
    outcome: outcomeAfterMove(chess, mover),
  };
}

/** Elo untuk kedua pemain sekaligus. */
export function eloPair(white: number, black: number, result: Result) {
  const scoreWhite = result === "1-0" ? 1 : result === "0-1" ? 0 : 0.5;
  const expectedWhite = 1 / (1 + 10 ** ((black - white) / 400));
  const delta = Math.round(RATING_K * (scoreWhite - expectedWhite));
  return { white: Math.max(100, white + delta), black: Math.max(100, black - delta) };
}

/** Skor dari sudut pandang satu pemain: menang, kalah, atau seri. */
export function resultFor(result: Result, color: Color): "menang" | "kalah" | "seri" {
  if (result === "1/2-1/2") return "seri";
  return result === winFor(color) ? "menang" : "kalah";
}
