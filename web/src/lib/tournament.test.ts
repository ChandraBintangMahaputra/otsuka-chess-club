import { describe, expect, it } from "vitest";
import {
  championOf,
  createResolver,
  generateKnockout,
  generateRoundRobin,
  posterTournament,
  renumber,
  standingsOf,
  tournamentDataSchema,
  type KnockoutSection,
  type RoundRobinSection,
} from "./tournament";

const poster = posterTournament();
const ko = poster.data.sections[0] as KnockoutSection;
const putri = poster.data.sections[1] as KnockoutSection;
const label = (id: string) => {
  const r = createResolver(ko.matches);
  const m = ko.matches.find((x) => x.id === id)!;
  return [r.slot(m.a), r.slot(m.b)].map((s) => s.name ?? s.placeholder);
};

describe("bagan poster", () => {
  it("sesuai jumlah laga per hari", () => {
    const count = (round: number) => ko.matches.filter((m) => m.round === round && m.id.startsWith("M")).length;
    expect([0, 1, 2, 3, 4].map(count)).toEqual([12, 6, 3, 2, 1]);
    expect(ko.matches.filter((m) => m.id.startsWith("BYE")).map((m) => m.round)).toEqual([0, 1, 2]);
  });

  it("sesuai pertemuan di poster", () => {
    expect(label("M1")).toEqual(["Sony Iskandar", "Ilham Septiadi"]);
    expect(label("M12")).toEqual(["Adam Ramadhan", "Poltak Simorangkir"]);
    expect(label("M13")).toEqual(["Budi Gunawan", "Pemenang M1"]);
    expect(label("M18")).toEqual(["Pemenang M10", "Pemenang M11"]);
    expect(label("M19")).toEqual(["Pemenang M12", "Pemenang M13"]);
    expect(label("M22")).toEqual(["Pemenang M18", "Pemenang M19"]);
    expect(label("M24")).toEqual(["Pemenang M22", "Pemenang M23"]);
  });

  it("lolos dari validasi", () => {
    expect(tournamentDataSchema.safeParse(poster.data).success).toBe(true);
  });

  it("pemenang mengalir ke babak berikutnya", () => {
    const s: KnockoutSection = { ...ko, matches: ko.matches.map((m) => (m.id === "M12" ? { ...m, winner: "b" } : m)) };
    const r = createResolver(s.matches);
    const m19 = s.matches.find((m) => m.id === "M19")!;
    expect(r.slot(m19.a).name).toBe("Poltak Simorangkir");
  });

  it("bagan putri sistem gugur", () => {
    const r = createResolver(putri.matches);
    const names = (id: string) => {
      const m = putri.matches.find((x) => x.id === id)!;
      return [r.slot(m.a), r.slot(m.b)].map((x) => x.name ?? x.placeholder);
    };
    expect(putri.kind).toBe("knockout");
    expect(putri.rounds.map((x) => x.name)).toEqual(["Babak 1", "Semifinal", "Final"]);
    expect(names("M1")).toEqual(["Pemy", "Tiara"]);
    expect(names("M2")).toEqual(["Nabila", "Baiti"]);
    expect(names("M3")).toEqual(["Diva", "Pemenang M1"]);
    expect(names("M4")).toEqual(["Pemenang M2", "Pemenang M3"]);
  });
});

describe("generator", () => {
  it("bagan 2^n tanpa BYE", () => {
    const g = generateKnockout(["a", "b", "c", "d", "e", "f", "g", "h"]);
    expect(g.rounds).toHaveLength(3);
    expect(g.matches).toHaveLength(7);
  });

  it("juara dari final", () => {
    const g = generateKnockout(["a", "b"]);
    const s: KnockoutSection = { kind: "knockout", title: "", note: "", ...g };
    expect(championOf(s)).toBeNull();
    s.matches[0].winner = "a";
    expect(championOf(s)).toBe("a");
  });

  it("semua bertemu semua untuk peserta ganjil", () => {
    const sessions = generateRoundRobin(["a", "b", "c", "d", "e"]);
    expect(sessions).toHaveLength(5);
    expect(sessions.every((s) => s.games.length === 2 && s.rest)).toBe(true);
    const pairs = sessions.flatMap((s) => s.games.map((g) => [g.white, g.black].sort().join("-")));
    expect(new Set(pairs).size).toBe(10);
  });

  it("klasemen menghitung remis setengah poin", () => {
    const s: RoundRobinSection = {
      kind: "roundrobin",
      title: "",
      note: "",
      players: ["a", "b", "c"],
      sessions: [{ name: "", day: "", rest: "", games: [{ white: "a", black: "b", result: "1/2-1/2" }, { white: "c", black: "a", result: "0-1" }] }],
    };
    expect(standingsOf(s).map((r) => [r.name, r.points])).toEqual([["a", 1.5], ["b", 0.5], ["c", 0]]);
  });

  it("nomor ulang memperbarui rujukan", () => {
    const g = generateKnockout(["a", "b", "c", "d"]);
    const s: KnockoutSection = { kind: "knockout", title: "", note: "", ...g };
    s.matches = s.matches.map((m) => ({ ...m, id: m.id === "M1" ? "X" : m.id, a: m.a.kind === "winner" && m.a.match === "M1" ? { kind: "winner", match: "X" } : m.a }));
    const r = renumber(s);
    expect(r.matches.map((m) => m.id)).toEqual(["M1", "M2", "M3"]);
    expect(r.matches[2].a).toEqual({ kind: "winner", match: "M1" });
  });

  it("menolak rujukan yang tidak ada", () => {
    const g = generateKnockout(["a", "b", "c", "d"]);
    g.matches[2].a = { kind: "winner", match: "M9" };
    const r = tournamentDataSchema.safeParse({ footnote: "", sections: [{ kind: "knockout", title: "", note: "", ...g }] });
    expect(r.success).toBe(false);
  });
});
