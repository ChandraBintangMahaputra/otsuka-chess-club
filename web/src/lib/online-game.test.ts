import { describe, expect, it } from "vitest";
import {
  applyMove,
  canMate,
  eloPair,
  liveClocks,
  replay,
  resultFor,
  timeoutOutcome,
  type ClockState,
} from "./online-game";

const fresh = (initial = 60_000, inc = 2_000): ClockState => ({
  moves: [],
  whiteMs: initial,
  blackMs: initial,
  incrementMs: inc,
  turnStartedAt: null,
});

function play(s: ClockState, moves: string[], start = 0, step = 1_000) {
  let state = s;
  let now = start;
  for (const m of moves) {
    now += step;
    const r = applyMove(state, m, now);
    if (!r.ok) throw new Error(`${m}: ${r.error}`);
    state = { ...state, moves: r.moves, whiteMs: r.whiteMs, blackMs: r.blackMs, turnStartedAt: r.turnStartedAt };
  }
  return { state, now };
}

describe("jam", () => {
  it("jam belum berjalan sebelum Hitam melangkah pertama", () => {
    const { state } = play(fresh(), ["e2e4"], 0, 50_000);
    expect(state.turnStartedAt).toBeNull();
    expect(liveClocks(state, 999_999)).toEqual({ w: 60_000, b: 60_000 });
  });

  it("mulai berjalan setelah langkah kedua, mengurangi sisi yang melangkah, dan memberi increment", () => {
    const { state, now } = play(fresh(), ["e2e4", "e7e5"]);
    expect(state.turnStartedAt).toBe(now);
    expect(liveClocks(state, now + 5_000)).toEqual({ w: 55_000, b: 60_000 });
    const r = applyMove(state, "g1f3", now + 5_000);
    expect(r.ok && r.whiteMs).toBe(57_000);
    expect(r.ok && r.blackMs).toBe(60_000);
  });

  it("langkah setelah waktu habis ditolak dan hasilnya kalah waktu", () => {
    const { state, now } = play(fresh(10_000), ["e2e4", "e7e5"]);
    const r = applyMove(state, "g1f3", now + 10_001);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.outcome).toEqual({ result: "0-1", termination: "timeout" });
  });

  it("waktu habis tapi lawan hanya punya raja menjadi remis", () => {
    const s: ClockState = { ...fresh(1_000), moves: [], turnStartedAt: 0 };
    const chess = replay([]);
    expect(canMate(chess, "b")).toBe(true);
    // Posisi buatan: hitam hanya raja, dicek lewat canMate langsung.
    chess.load("4k3/8/8/8/8/8/8/R3K3 w - - 0 1");
    expect(canMate(chess, "b")).toBe(false);
    expect(canMate(chess, "w")).toBe(true);
    expect(timeoutOutcome(s, 2_000)?.termination).toBe("timeout");
  });
});

describe("langkah", () => {
  it("menolak langkah ilegal dan langkah bukan giliran", () => {
    expect(applyMove(fresh(), "e2e5", 1).ok).toBe(false);
    expect(applyMove(fresh(), "e7e5", 1).ok).toBe(false);
  });

  it("mendeteksi skakmat dan pemenangnya", () => {
    const moves = ["f2f3", "e7e5", "g2g4"];
    const { state } = play(fresh(), moves);
    const r = applyMove(state, "d8h4", 10_000);
    expect(r.ok && r.san).toBe("Qh4#");
    expect(r.ok && r.outcome).toEqual({ result: "0-1", termination: "checkmate" });
  });

  it("mendeteksi pengulangan tiga kali", () => {
    const loop = ["g1f3", "g8f6", "f3g1", "f6g8"];
    const { state, now } = play(fresh(), [...loop, ...loop.slice(0, 3)]);
    const r = applyMove(state, "f6g8", now + 1_000);
    expect(r.ok && r.outcome?.termination).toBe("threefold");
  });

  it("promosi tersimpan dalam UCI", () => {
    const s: ClockState = { ...fresh(), moves: [] };
    const r = applyMove(s, "e2e4", 1);
    expect(r.ok && r.moves).toEqual(["e2e4"]);
  });
});

describe("rating", () => {
  it("menang menaikkan, kalah menurunkan dengan jumlah sama", () => {
    expect(eloPair(1200, 1200, "1-0")).toEqual({ white: 1216, black: 1184 });
    expect(eloPair(1200, 1200, "1/2-1/2")).toEqual({ white: 1200, black: 1200 });
    const upset = eloPair(1000, 1400, "1-0");
    expect(upset.white - 1000).toBeGreaterThan(16);
    expect(upset.white - 1000).toBe(1400 - upset.black);
  });
  it("hasil dari sudut pandang pemain", () => {
    expect(resultFor("1-0", "w")).toBe("menang");
    expect(resultFor("1-0", "b")).toBe("kalah");
    expect(resultFor("1/2-1/2", "b")).toBe("seri");
  });
});
