import type { Color, Result, Termination } from "./online-game";

/** Tipe data permainan online yang aman dipakai di browser. */

export type PlayerView = { id: string; fullName: string; username: string; department: string; rating: number };

export type GameView = {
  id: string;
  white: PlayerView;
  black: PlayerView;
  myColor: Color | null;
  moves: string[];
  sanMoves: string[];
  fen: string;
  lastMove: { from: string; to: string; san: string } | null;
  status: "active" | "finished" | "aborted";
  result: Result | null;
  termination: Termination | null;
  drawOffer: Color | null;
  clocks: { w: number; b: number };
  clockRunning: boolean;
  initialMs: number;
  incrementMs: number;
  ratingChange: { w: number; b: number } | null;
  serverNow: number;
};
