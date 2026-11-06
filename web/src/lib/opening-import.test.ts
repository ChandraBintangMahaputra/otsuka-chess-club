import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { familyOf, guessSide, parseTsv, slugify } from "./opening-import";

const DIR = path.resolve("data/lichess-openings");

describe("aturan impor", () => {
  it("slug aman untuk URL", () => {
    expect(slugify("King's Indian Defense: Sämisch Variation")).toBe("kings-indian-defense-samisch-variation");
  });
  it("keluarga dan sisi dari nama", () => {
    expect(familyOf("Sicilian Defense: Najdorf Variation")).toBe("Sicilian Defense");
    expect(guessSide("Sicilian Defense: Najdorf Variation")).toBe("black");
    expect(guessSide("Queen's Gambit Declined: Lasker Defense")).toBe("black");
    expect(guessSide("Italian Game: Two Knights Defense")).toBe("white");
  });
});

describe("data Lichess", () => {
  const rows = readdirSync(DIR)
    .filter((f) => f.endsWith(".tsv"))
    .flatMap((f) => parseTsv(readFileSync(path.join(DIR, f), "utf8")));

  it("lengkap dan semua PGN bisa dimainkan", () => {
    expect(rows.length).toBeGreaterThan(3500);
    const bad = rows.filter((r) => {
      try {
        new Chess().loadPgn(r.pgn);
        return !/^[A-E]\d\d$/.test(r.eco);
      } catch {
        return true;
      }
    });
    expect(bad).toEqual([]);
  }, 60_000);
});
