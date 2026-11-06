import { Chess, type Move } from "chess.js";

export type PuzzleInput = { fen: string; moves: string };
export type MoveInput = { from: string; to: string; promotion?: string };

export type MoveResult =
  | { status: "illegal" }
  | { status: "wrong"; san: string }
  | { status: "correct"; san: string; reply: Move | null }
  | { status: "complete"; san: string };

export function uciToMove(uci: string): MoveInput {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

/**
 * Alur puzzle FSD 5.5. Langkah pertama kolom `moves` adalah langkah lawan,
 * jadi sisi pemain adalah sisi yang melangkah setelah langkah itu.
 */
export class PuzzleGame {
  readonly chess: Chess;
  readonly solution: string[];
  /** Indeks langkah solusi berikutnya yang harus dimainkan. */
  index = 0;
  private readonly startFen: string;

  constructor(puzzle: PuzzleInput) {
    this.startFen = puzzle.fen;
    this.chess = new Chess(puzzle.fen);
    this.solution = puzzle.moves.trim().split(/\s+/);
  }

  get fen() {
    return this.chess.fen();
  }

  get isComplete() {
    return this.index >= this.solution.length;
  }

  /** Warna pemain. Sisi yang melangkah di FEN awal adalah lawan. */
  get playerColor(): "w" | "b" {
    return new Chess(this.startFen).turn() === "w" ? "b" : "w";
  }

  /** Langkah 1 alur: mainkan langkah lawan yang membuka taktik. */
  playOpening(): Move {
    return this.advance();
  }

  /** Kembali ke posisi setelah langkah lawan pertama, untuk "Coba lagi". */
  reset(): Move {
    this.chess.load(this.startFen);
    this.index = 0;
    return this.playOpening();
  }

  /** Petak asal langkah yang harus dimainkan (PZ-03). */
  hintSquare(): string | null {
    return this.isComplete ? null : this.solution[this.index].slice(0, 2);
  }

  /** Memainkan satu langkah solusi, dipakai juga oleh Lihat Solusi. */
  advance(): Move {
    const move = this.chess.move(uciToMove(this.solution[this.index]));
    this.index += 1;
    return move;
  }

  tryMove(input: MoveInput): MoveResult {
    if (this.isComplete) return { status: "illegal" };

    const probe = new Chess(this.chess.fen());
    let played: Move;
    try {
      played = probe.move(input);
    } catch {
      return { status: "illegal" };
    }

    const expected = this.solution[this.index];
    const uci = played.from + played.to + (played.promotion ?? "");

    if (probe.isCheckmate()) {
      // Langkah skakmat selalu benar walau berbeda dari solusi tersimpan.
      this.chess.move(input);
      this.index = this.solution.length;
      return { status: "complete", san: played.san };
    }

    if (uci !== expected) return { status: "wrong", san: played.san };

    this.advance();
    if (this.isComplete) return { status: "complete", san: played.san };
    return { status: "correct", san: played.san, reply: this.advance() };
  }
}
