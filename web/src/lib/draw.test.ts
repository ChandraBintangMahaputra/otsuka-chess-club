import { describe, expect, it } from "vitest";
import { applyDraw, computeDraw, currentAssignment, drawProblem, seededShuffle, verifyDraw } from "./draw";
import { createResolver, posterTournament, type KnockoutSection } from "./tournament";

const putra = posterTournament().data.sections[0] as KnockoutSection;
const SEED = "0123456789abcdef0123456789abcdef";

describe("undian", () => {
  it("kode yang sama selalu memberi hasil yang sama", () => {
    const list = ["a", "b", "c", "d", "e", "f"];
    expect(seededShuffle(list, SEED)).toEqual(seededShuffle(list, SEED));
    expect(seededShuffle(list, SEED)).not.toEqual(seededShuffle(list, "f".repeat(32)));
    expect([...seededShuffle(list, SEED)].sort()).toEqual(list);
  });

  it("urutan ketik peserta tidak berpengaruh", () => {
    const reversed: KnockoutSection = {
      ...putra,
      matches: putra.matches.map((m) => ({ ...m, a: m.b.kind === "player" ? m.b : m.a, b: m.b.kind === "player" ? m.a : m.b })),
    };
    expect(computeDraw(reversed, SEED).result).toEqual(computeDraw(putra, SEED).result);
  });

  it("struktur bagan tetap, hanya nama yang berpindah", () => {
    const { result } = computeDraw(putra, SEED);
    const drawn = applyDraw(putra, result);
    expect(drawn.matches.map((m) => [m.id, m.round, m.a.kind, m.b.kind])).toEqual(
      putra.matches.map((m) => [m.id, m.round, m.a.kind, m.b.kind]),
    );
    expect(currentAssignment(drawn)).toEqual(result);
    expect(new Set(result).size).toBe(25);
    // Pemenang laga BYE tetap mengalir ke babak berikutnya.
    const m13 = drawn.matches.find((m) => m.id === "M13")!;
    expect(createResolver(drawn.matches).slot(m13.a).name).toBe(result[24]);
  });

  it("verifikasi mendeteksi bagan yang diubah setelah undian", () => {
    const draw = { seed: SEED, ...computeDraw(putra, SEED) };
    const drawn = applyDraw(putra, draw.result);
    expect(verifyDraw(draw, drawn)).toEqual({ reproducible: true, matchesBracket: true });
    const edited = structuredClone(drawn);
    const [x, y] = [edited.matches[0].a, edited.matches[0].b];
    edited.matches[0].a = y;
    edited.matches[0].b = x;
    expect(verifyDraw(draw, edited)).toEqual({ reproducible: true, matchesBracket: false });
    expect(verifyDraw({ ...draw, result: [...draw.result].reverse() }, drawn).reproducible).toBe(false);
  });

  it("menolak nama kosong atau ganda", () => {
    const s = structuredClone(putra);
    s.matches[0].a = { kind: "player", name: "Nopiar" };
    expect(drawProblem(s)).toMatch(/sama/);
    s.matches[0].a = { kind: "player", name: " " };
    expect(drawProblem(s)).toMatch(/kosong/);
    expect(drawProblem(putra)).toBeNull();
  });
});
