import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { lessons } from "./lessons";
import { openings } from "./openings";
import { activities } from "./activities";
import { parseContent } from "@/lib/board-directive";
import { normalizeSan } from "@/lib/san";

const SQUARE = /^[a-h][1-8]$/;

describe("materi", () => {
  it("setiap bab 1–9 punya materi dan setiap materi punya latihan", () => {
    expect(new Set(lessons.map((l) => l.chapter)).size).toBe(9);
    for (const l of lessons) expect(l.exercises.length, l.slug).toBeGreaterThan(0);
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
  });

  for (const l of lessons) {
    it(`papan contoh valid: ${l.slug}`, () => {
      for (const b of parseContent(l.content_md)) {
        if (b.type !== "board") continue;
        expect(() => new Chess(b.board.fen), b.board.fen).not.toThrow();
        for (const a of b.board.arrows) {
          expect(a.slice(0, 2)).toMatch(SQUARE);
          expect(a.slice(2, 4)).toMatch(SQUARE);
        }
      }
    });

    l.exercises.forEach((ex, i) => {
      it(`latihan legal: ${l.slug} #${i + 1}`, () => {
        for (const answer of ex.answers) {
          const c = new Chess(ex.fen);
          const legal = c.moves().map(normalizeSan);
          expect(legal, `${answer} pada ${ex.fen}`).toContain(normalizeSan(answer));
          c.move(c.moves().find((m) => normalizeSan(m) === normalizeSan(answer))!);
          if (ex.expect === "mate") expect(c.isCheckmate(), answer).toBe(true);
          if (ex.expect === "draw") expect(c.isDraw(), answer).toBe(true);
        }
      });
    });
  }

  it("contoh pat dan skakmat di materi memang benar", () => {
    expect(new Chess("7k/8/5KQ1/8/8/8/8/8 b - - 0 1").isStalemate()).toBe(true);
    expect(new Chess("R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1").isCheckmate()).toBe(true);
  });
});

describe("opening", () => {
  it("ada 10 opening utama", () => {
    expect(openings.filter((o) => !o.parent).length).toBe(10);
    for (const o of openings.filter((x) => x.parent)) {
      expect(openings.some((p) => p.slug === o.parent)).toBe(true);
    }
  });

  for (const o of openings) {
    it(`PGN dan catatan valid: ${o.slug}`, () => {
      const c = new Chess();
      c.loadPgn(o.pgn);
      const plies = c.history().length;
      expect(plies).toBeGreaterThan(5);
      expect(o.first_move).toBe(`1.${c.history()[0]}`);
      expect(o.eco).toMatch(/^[A-E]\d\d$/);
      for (const k of Object.keys(o.move_notes)) {
        expect(Number(k)).toBeGreaterThanOrEqual(1);
        expect(Number(k), `${o.slug} ply ${k}`).toBeLessThanOrEqual(plies);
      }
      if (!o.parent) expect(Object.keys(o.move_notes).length).toBe(plies);
    });
  }

  it("variasi memang melanjutkan jalur yang sama sampai langkah ketiga", () => {
    const line = (pgn: string) => {
      const c = new Chess();
      c.loadPgn(pgn);
      return c.history().slice(0, 6);
    };
    const italian = openings.find((o) => o.slug === "italian-game")!;
    for (const o of openings.filter((x) => x.parent === "italian-game")) {
      expect(line(o.pgn)).toEqual(line(italian.pgn));
    }
  });
});

describe("dokumentasi", () => {
  it("minimal 3 kegiatan, PGN valid", () => {
    expect(activities.length).toBeGreaterThanOrEqual(3);
    for (const a of activities) {
      if (!a.pgn) continue;
      const c = new Chess();
      c.loadPgn(a.pgn);
      expect(c.isCheckmate()).toBe(true);
    }
  });
});
