import { z } from "zod";

/**
 * Turnamen disimpan sebagai satu dokumen JSON (kolom `tournaments.data`) agar bagan
 * bisa diatur bebas oleh admin: babak, pertemuan, BYE, skor, dan pemenang.
 */

export type Slot = { kind: "player"; name: string } | { kind: "winner"; match: string } | { kind: "bye" };
export type Side = "a" | "b";

export type KoMatch = {
  id: string;
  round: number;
  a: Slot;
  b: Slot;
  scoreA: string;
  scoreB: string;
  winner: Side | null;
};

export type KoRound = { name: string; detail: string };

export type KnockoutSection = {
  kind: "knockout";
  title: string;
  note: string;
  rounds: KoRound[];
  matches: KoMatch[];
};

export type RrResult = "1-0" | "0-1" | "1/2-1/2" | null;
export type RrGame = { white: string; black: string; result: RrResult };
export type RrSession = { name: string; day: string; games: RrGame[]; rest: string };

export type RoundRobinSection = {
  kind: "roundrobin";
  title: string;
  note: string;
  players: string[];
  sessions: RrSession[];
};

export type Section = KnockoutSection | RoundRobinSection;
export type TournamentData = { sections: Section[]; footnote: string };

export type Tournament = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  isPublished: boolean;
  data: TournamentData;
};

/* Validasi */

const name = z.string().trim().max(80);
const score = z.string().trim().max(12);

const slotSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("player"), name }),
  z.object({ kind: z.literal("winner"), match: z.string().max(20) }),
  z.object({ kind: z.literal("bye") }),
]);

const knockoutSchema = z.object({
  kind: z.literal("knockout"),
  title: z.string().trim().max(120),
  note: z.string().trim().max(300),
  rounds: z.array(z.object({ name: z.string().trim().max(40), detail: z.string().trim().max(80) })).max(12),
  matches: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(20),
        round: z.number().int().min(0).max(11),
        a: slotSchema,
        b: slotSchema,
        scoreA: score,
        scoreB: score,
        winner: z.enum(["a", "b"]).nullable(),
      }),
    )
    .max(256),
});

const roundRobinSchema = z.object({
  kind: z.literal("roundrobin"),
  title: z.string().trim().max(120),
  note: z.string().trim().max(300),
  players: z.array(name).max(32),
  sessions: z
    .array(
      z.object({
        name: z.string().trim().max(40),
        day: z.string().trim().max(40),
        rest: z.string().trim().max(80),
        games: z
          .array(z.object({ white: name, black: name, result: z.enum(["1-0", "0-1", "1/2-1/2"]).nullable() }))
          .max(16),
      }),
    )
    .max(64),
});

export const tournamentDataSchema = z
  .object({
    sections: z.array(z.discriminatedUnion("kind", [knockoutSchema, roundRobinSchema])).max(6),
    footnote: z.string().trim().max(300),
  })
  .superRefine((data, ctx) => {
    data.sections.forEach((s, si) => {
      if (s.kind !== "knockout") return;
      const ids = new Set<string>();
      for (const m of s.matches) {
        if (ids.has(m.id)) ctx.addIssue({ code: "custom", message: `Kode laga ${m.id} dipakai dua kali`, path: ["sections", si] });
        ids.add(m.id);
        if (m.round >= s.rounds.length)
          ctx.addIssue({ code: "custom", message: `Laga ${m.id} berada di babak yang tidak ada`, path: ["sections", si] });
      }
      for (const m of s.matches)
        for (const slot of [m.a, m.b])
          if (slot.kind === "winner" && !ids.has(slot.match))
            ctx.addIssue({ code: "custom", message: `Laga ${m.id} merujuk laga ${slot.match} yang tidak ada`, path: ["sections", si] });
      if (hasCycle(s.matches))
        ctx.addIssue({ code: "custom", message: "Bagan berputar: ada laga yang merujuk dirinya sendiri", path: ["sections", si] });
    });
  });

export const tournamentMetaSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,120}$/, "Slug: huruf kecil, angka, dan tanda hubung"),
  subtitle: z.string().trim().max(200),
});

function hasCycle(matches: KoMatch[]) {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const state = new Map<string, 1 | 2>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 2) return false;
    if (state.get(id) === 1) return true;
    state.set(id, 1);
    const m = byId.get(id);
    for (const s of m ? [m.a, m.b] : []) if (s.kind === "winner" && visit(s.match)) return true;
    state.set(id, 2);
    return false;
  };
  return matches.some((m) => visit(m.id));
}

/* Membaca bagan */

export const isByeMatch = (m: KoMatch) => m.a.kind === "bye" || m.b.kind === "bye";

/** Sisi yang lolos: pilihan admin, atau otomatis bila lawannya BYE. */
export function winnerSide(m: KoMatch): Side | null {
  if (m.winner) return m.winner;
  if (m.b.kind === "bye" && m.a.kind !== "bye") return "a";
  if (m.a.kind === "bye" && m.b.kind !== "bye") return "b";
  return null;
}

export type ResolvedSlot = { name: string | null; placeholder: string; bye: boolean };

export function createResolver(matches: KoMatch[]) {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const memo = new Map<string, ResolvedSlot>();

  function slot(s: Slot, depth = 0): ResolvedSlot {
    if (s.kind === "bye") return { name: null, placeholder: "BYE", bye: true };
    if (s.kind === "player") return { name: s.name || null, placeholder: "Belum diisi", bye: false };
    return winnerOf(s.match, depth);
  }

  function winnerOf(id: string, depth = 0): ResolvedSlot {
    const cached = memo.get(id);
    if (cached) return cached;
    const m = byId.get(id);
    if (!m || depth > 64) return { name: null, placeholder: `Pemenang ${id}`, bye: false };
    const side = winnerSide(m);
    let r: ResolvedSlot;
    if (side) {
      const inner = slot(m[side], depth + 1);
      // Pemenang laga BYE yang lawannya belum jelas ditulis sesuai laga asalnya.
      r = inner.name ? inner : { name: null, placeholder: isByeMatch(m) ? inner.placeholder : `Pemenang ${id}`, bye: false };
    } else r = { name: null, placeholder: `Pemenang ${id}`, bye: false };
    memo.set(id, r);
    return r;
  }

  return { slot, winnerOf };
}

/** Juara: pemenang laga di babak terakhir (bila hanya satu laga di sana). */
export function championOf(s: KnockoutSection) {
  const last = s.matches.filter((m) => m.round === s.rounds.length - 1 && !isByeMatch(m));
  if (last.length !== 1) return null;
  return createResolver(s.matches).winnerOf(last[0].id).name;
}

export type Standing = { name: string; played: number; win: number; draw: number; loss: number; points: number };

export function standingsOf(s: RoundRobinSection): Standing[] {
  const table = new Map<string, Standing>(
    s.players.map((p) => [p, { name: p, played: 0, win: 0, draw: 0, loss: 0, points: 0 }]),
  );
  const row = (p: string) => {
    if (!table.has(p)) table.set(p, { name: p, played: 0, win: 0, draw: 0, loss: 0, points: 0 });
    return table.get(p)!;
  };
  for (const session of s.sessions)
    for (const g of session.games) {
      if (!g.result || !g.white || !g.black) continue;
      const w = row(g.white);
      const b = row(g.black);
      w.played++;
      b.played++;
      const [pw, pb] = g.result === "1-0" ? [1, 0] : g.result === "0-1" ? [0, 1] : [0.5, 0.5];
      for (const [r, p] of [[w, pw], [b, pb]] as const) {
        r.points += p;
        if (p === 1) r.win++;
        else if (p === 0) r.loss++;
        else r.draw++;
      }
    }
  return [...table.values()].sort((x, y) => y.points - x.points || y.win - x.win || x.name.localeCompare(y.name));
}

export const formatPoints = (p: number) => (Number.isInteger(p) ? String(p) : `${Math.floor(p) || ""}½`);

/* Generator */

/**
 * Bagan gugur untuk jumlah peserta berapa pun: peserta dipasangkan berurutan,
 * yang tersisa mendapat BYE dan tampil paling atas di babak berikutnya.
 */
export function generateKnockout(players: string[], roundNames: KoRound[] = []): Pick<KnockoutSection, "rounds" | "matches"> {
  const matches: KoMatch[] = [];
  const rounds: KoRound[] = [];
  let entrants: Slot[] = players.map((p) => ({ kind: "player", name: p }));
  let n = 0;
  let byes = 0;
  let round = 0;
  while (entrants.length > 1) {
    const next: Slot[] = [];
    let bye: Slot | null = null;
    let games = 0;
    for (let i = 0; i + 1 < entrants.length; i += 2) {
      const id = `M${++n}`;
      matches.push({ id, round, a: entrants[i], b: entrants[i + 1], scoreA: "", scoreB: "", winner: null });
      next.push({ kind: "winner", match: id });
      games++;
    }
    if (entrants.length % 2) {
      const id = `BYE${++byes}`;
      matches.push({ id, round, a: entrants[entrants.length - 1], b: { kind: "bye" }, scoreA: "", scoreB: "", winner: null });
      bye = { kind: "winner", match: id };
    }
    rounds.push({
      name: roundNames[round]?.name ?? `Babak ${round + 1}`,
      detail: roundNames[round]?.detail ?? `${games} laga${bye ? " · 1 BYE" : ""}`,
    });
    entrants = bye ? [bye, ...next] : next;
    round++;
  }
  return { rounds, matches };
}

/** Jadwal semua bertemu semua (metode lingkaran). Peserta ganjil mendapat istirahat. */
export function generateRoundRobin(players: string[], day = ""): RrSession[] {
  const list: (string | null)[] = [...players];
  if (list.length % 2) list.push(null);
  const n = list.length;
  const sessions: RrSession[] = [];
  for (let r = 0; r < n - 1; r++) {
    const games: RrGame[] = [];
    let rest = "";
    for (let i = 0; i < n / 2; i++) {
      const x = list[i];
      const y = list[n - 1 - i];
      if (x === null || y === null) rest = (x ?? y) as string;
      else games.push(r % 2 ? { white: y, black: x, result: null } : { white: x, black: y, result: null });
    }
    sessions.push({ name: `Sesi ${r + 1}`, day, games, rest });
    list.splice(1, 0, list.pop()!);
  }
  return sessions;
}

/** Ganti kode laga menjadi M1, M2, … berurutan per babak, rujukan ikut diperbarui. */
export function renumber(s: KnockoutSection): KnockoutSection {
  const ordered = [...s.matches].sort((x, y) => x.round - y.round);
  const map = new Map<string, string>();
  let n = 0;
  let b = 0;
  for (const m of ordered) map.set(m.id, isByeMatch(m) ? `BYE${++b}` : `M${++n}`);
  const fix = (slot: Slot): Slot => (slot.kind === "winner" ? { kind: "winner", match: map.get(slot.match) ?? slot.match } : slot);
  return { ...s, matches: s.matches.map((m) => ({ ...m, id: map.get(m.id)!, a: fix(m.a), b: fix(m.b) })) };
}

/* Bagan sesuai poster turnamen Senin sampai Jumat */

const POSTER_PUTRA = [
  "Sony Iskandar", "Ilham Septiadi", "Nopiar", "Sigit Wiratno", "Fadillah Ariadinata", "Zainy Maulana Malik",
  "Abdurahman", "Rustu", "Dimas Algy Pratama Iriyanto", "Aggie Adrian", "Sahrul", "Eka Maulana Yusuf",
  "Riki Irawan", "RRD Wahyuaji", "Agus Setiawan", "Yusup Gunawan", "Ujang", "Zaka", "Gugus Jaya Permana",
  "Anggi Ahmad Saputra", "Adhimas Rizki Wijaksono", "Ruli Raksa", "Adam Ramadhan", "Poltak Simorangkir",
  "Budi Gunawan",
];

const POSTER_PUTRI_SESSIONS: [string, string, string, string, string][] = [
  ["Pemy", "Tiara", "Nabila", "Baiti", "Diva"],
  ["Diva", "Tiara", "Pemy", "Nabila", "Baiti"],
  ["Diva", "Baiti", "Tiara", "Nabila", "Pemy"],
  ["Diva", "Nabila", "Baiti", "Pemy", "Tiara"],
  ["Diva", "Pemy", "Baiti", "Tiara", "Nabila"],
];

export function posterTournament(): Omit<Tournament, "id"> {
  const ko = generateKnockout(POSTER_PUTRA, [
    { name: "Senin", detail: "Babak 1 · 12 laga · 1 BYE" },
    { name: "Selasa", detail: "Babak 2 · 6 laga · 1 BYE" },
    { name: "Rabu", detail: "Perempat final · 3 laga · 1 BYE" },
    { name: "Kamis", detail: "Semifinal · 2 laga" },
    { name: "Jumat", detail: "Final · 1 laga" },
  ]);
  return {
    slug: "turnamen-catur",
    title: "Turnamen Catur",
    subtitle: "Sistem gugur · pertemuan diacak · Senin sampai Jumat",
    isPublished: true,
    data: {
      footnote: "Pemenang M# berarti pemenang dari pertandingan bernomor tersebut. Bagan putra memakai undian acak.",
      sections: [
        {
          kind: "knockout",
          title: "Putra · Sistem gugur",
          note: "Pemenang lanjut ke babak berikutnya. BYE berarti lolos otomatis.",
          ...ko,
        },
        {
          kind: "roundrobin",
          title: "Putri · Semua bertemu semua",
          note: "Jadwal terpisah, satu hari penuh, lima sesi.",
          players: ["Pemy", "Tiara", "Nabila", "Baiti", "Diva"],
          sessions: POSTER_PUTRI_SESSIONS.map(([a, b, c, d, rest], i) => ({
            name: `Sesi ${i + 1}`,
            day: "Sabtu",
            rest,
            games: [
              { white: a, black: b, result: null },
              { white: c, black: d, result: null },
            ],
          })),
        },
      ],
    },
  };
}

export const emptyKnockout = (): KnockoutSection => ({
  kind: "knockout",
  title: "Sistem gugur",
  note: "",
  ...generateKnockout(["Peserta 1", "Peserta 2", "Peserta 3", "Peserta 4"]),
});

export const emptyRoundRobin = (): RoundRobinSection => {
  const players = ["Peserta 1", "Peserta 2", "Peserta 3", "Peserta 4"];
  return { kind: "roundrobin", title: "Semua bertemu semua", note: "", players, sessions: generateRoundRobin(players) };
};
