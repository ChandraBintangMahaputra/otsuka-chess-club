import { describe, expect, it } from "vitest";
import { PuzzleGame } from "./puzzle-engine";
import { expectedScore, nextRating } from "./elo";
import { parseContent } from "./board-directive";
import { loginSchema, registerSchema, safeNext } from "./validation";
import { todayWib } from "./date";

const FEN = "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24";
const MOVES = "f2g3 e6e7 b2b1 b3c1 b1c1 h6c1";

describe("PuzzleGame", () => {
  it("memainkan langkah lawan dulu lalu giliran pemain", () => {
    const g = new PuzzleGame({ fen: FEN, moves: MOVES });
    expect(g.playerColor).toBe("w");
    g.playOpening();
    expect(g.chess.turn()).toBe("w");
    expect(g.hintSquare()).toBe("e6");
  });

  it("langkah benar dibalas lawan, puzzle selesai saat solusi habis", () => {
    const g = new PuzzleGame({ fen: FEN, moves: MOVES });
    g.playOpening();
    const a = g.tryMove({ from: "e6", to: "e7" });
    expect(a.status).toBe("correct");
    if (a.status === "correct") expect(a.reply?.san).toBe("Qb1+");
    expect(g.tryMove({ from: "b3", to: "c1" }).status).toBe("correct");
    expect(g.tryMove({ from: "h6", to: "c1" }).status).toBe("complete");
    expect(g.isComplete).toBe(true);
  });

  it("langkah legal tapi bukan solusi gagal dan posisi tidak berubah", () => {
    const g = new PuzzleGame({ fen: FEN, moves: MOVES });
    g.playOpening();
    const before = g.fen;
    expect(g.tryMove({ from: "a7", to: "a6" }).status).toBe("illegal");
    expect(g.tryMove({ from: "h2", to: "g3" }).status).toBe("wrong");
    expect(g.fen).toBe(before);
  });

  it("reset mengembalikan ke posisi setelah langkah lawan", () => {
    const g = new PuzzleGame({ fen: FEN, moves: MOVES });
    g.playOpening();
    const start = g.fen;
    g.tryMove({ from: "e6", to: "e7" });
    g.reset();
    expect(g.fen).toBe(start);
    expect(g.index).toBe(1);
  });

  it("skakmat alternatif diterima walau beda dari solusi", () => {
    // Solusi tersimpan memakai benteng a, tetapi Rd8# juga mat.
    const g = new PuzzleGame({ fen: "6k1/5ppp/8/8/8/8/8/R2R2K1 b - - 0 1", moves: "g8h8 a1a8" });
    g.playOpening();
    expect(g.tryMove({ from: "g1", to: "g2" }).status).toBe("wrong");
    expect(g.tryMove({ from: "d1", to: "d8" }).status).toBe("complete");
    expect(g.isComplete).toBe(true);
  });

  it("promosi dicocokkan dengan solusi", () => {
    const g = new PuzzleGame({ fen: "8/P6k/8/8/8/8/6K1/8 b - - 0 1", moves: "h7h6 a7a8q" });
    g.playOpening();
    expect(g.tryMove({ from: "a7", to: "a8", promotion: "n" }).status).toBe("wrong");
    expect(g.tryMove({ from: "a7", to: "a8", promotion: "q" }).status).toBe("complete");
  });
});

describe("Elo", () => {
  it("menang menaikkan, kalah menurunkan, petunjuk tidak mengubah", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
    expect(nextRating(1200, 1200, true, false)).toBe(1212);
    expect(nextRating(1200, 1200, false, false)).toBe(1188);
    expect(nextRating(1200, 1200, true, true)).toBe(1200);
  });
});

describe("parseContent", () => {
  it("memisahkan markdown dan papan", () => {
    const blocks = parseContent(
      'Halo\n\n::board{fen="8/8/8/8/8/8/8/8 w - - 0 1" arrows="e2e4 d2d4" caption="Pusat"}\n\nAkhir',
    );
    expect(blocks.map((b) => b.type)).toEqual(["md", "board", "md"]);
    const b = blocks[1];
    if (b.type === "board") {
      expect(b.board.arrows).toEqual(["e2e4", "d2d4"]);
      expect(b.board.caption).toBe("Pusat");
    }
  });
});

describe("validasi", () => {
  const base = {
    fullName: "Budi Santoso",
    username: "budi.s",
    email: "Budi@Gmail.com",
    division: "Prod - AL4",
    password: "rahasia123",
    confirmPassword: "rahasia123",
  };
  it("menerima data benar dan menormalkan email", () => {
    expect(registerSchema.parse(base).email).toBe("budi@gmail.com");
  });
  it("email boleh dari domain apa pun", () => {
    expect(registerSchema.safeParse({ ...base, email: "budi@yahoo.co.id" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, email: "bukan-email" }).success).toBe(false);
  });
  it("departemen harus dari daftar", () => {
    expect(registerSchema.safeParse({ ...base, division: "Intern" }).success).toBe(true);
    const r = registerSchema.safeParse({ ...base, division: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Pilih departemen dari daftar");
    expect(registerSchema.safeParse({ ...base, division: "Karangan" }).success).toBe(false);
  });
  it("menolak username dan password lemah", () => {
    expect(registerSchema.safeParse({ ...base, username: "A!" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, username: "Budi" }).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "abcdefgh", confirmPassword: "abcdefgh" }).success,
    ).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: "beda12345" }).success).toBe(false);
  });
  it("login menormalkan identifier", () => {
    expect(loginSchema.parse({ identifier: " Budi ", password: "x" }).identifier).toBe("budi");
  });
  it("safeNext menolak redirect keluar", () => {
    expect(safeNext("/admin")).toBe("/admin");
    expect(safeNext("//evil.com")).toBe("/profil");
    expect(safeNext("https://evil.com")).toBe("/profil");
    expect(safeNext("/\\evil.com")).toBe("/profil");
  });
});

describe("todayWib", () => {
  it("berganti tanggal pukul 00.00 WIB", () => {
    expect(todayWib(new Date("2026-11-06T16:59:00Z"))).toBe("2026-11-06");
    expect(todayWib(new Date("2026-11-06T17:00:00Z"))).toBe("2026-11-07");
  });
});
