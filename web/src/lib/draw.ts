import type { KnockoutSection, Side } from "./tournament";

/**
 * Undian yang bisa diperiksa ulang siapa pun.
 *
 * 1. Server membuat kode undian (seed) 128-bit dari generator acak kriptografis.
 *    Admin hanya menekan tombol, tidak bisa memilih kodenya.
 * 2. Nama peserta diurutkan abjad dulu, jadi urutan ketik admin tidak berpengaruh.
 * 3. Daftar diacak dengan Fisher–Yates memakai PRNG sfc32 yang diisi dari kode undian.
 * 4. Hasil diisikan ke posisi pemain di bagan, urut babak, laga, lalu sisi atas–bawah.
 *
 * Dengan kode dan daftar nama yang sama, hasilnya selalu sama, di server maupun di browser.
 */

export const DRAW_ALGORITHM = "sfc32-fisher-yates-v1";

export type DrawRecord = {
  id: string;
  sectionIndex: number;
  sectionTitle: string;
  seed: string;
  players: string[];
  result: string[];
  createdBy: string;
  createdAt: string;
};

function sfc32(seedHex: string) {
  if (!/^[0-9a-f]{32}$/.test(seedHex)) throw new Error("Kode undian harus 32 karakter heksadesimal");
  let [a, b, c, d] = [0, 8, 16, 24].map((i) => parseInt(seedHex.slice(i, i + 8), 16) >>> 0);
  const next = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  // Buang beberapa angka awal agar keadaan PRNG tercampur rata.
  for (let i = 0; i < 15; i++) next();
  return next;
}

export function seededShuffle<T>(list: readonly T[], seedHex: string): T[] {
  const random = sfc32(seedHex);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const canonicalOrder = (names: readonly string[]) =>
  [...names].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));

/** Posisi pemain di bagan, urut babak lalu urutan laga, sisi atas dulu. */
export function playerPositions(section: KnockoutSection) {
  const positions: { index: number; side: Side }[] = [];
  section.matches
    .map((m, index) => ({ m, index }))
    .sort((x, y) => x.m.round - y.m.round || x.index - y.index)
    .forEach(({ m, index }) => {
      for (const side of ["a", "b"] as const) if (m[side].kind === "player") positions.push({ index, side });
    });
  return positions;
}

export function currentAssignment(section: KnockoutSection) {
  return playerPositions(section).map(({ index, side }) => {
    const s = section.matches[index][side];
    return s.kind === "player" ? s.name.trim() : "";
  });
}

export function drawProblem(section: KnockoutSection): string | null {
  const names = currentAssignment(section);
  if (names.length < 2) return "Bagan butuh minimal dua posisi pemain.";
  if (names.some((n) => !n)) return "Masih ada posisi pemain yang namanya kosong.";
  if (new Set(names).size !== names.length) return "Ada nama peserta yang sama. Bedakan dulu namanya.";
  return null;
}

/** Hasil undian dari kode tertentu, tanpa mengubah bagan. */
export function computeDraw(section: KnockoutSection, seed: string) {
  const players = canonicalOrder(currentAssignment(section));
  return { players, result: seededShuffle(players, seed) };
}

/** Mengisi nama hasil undian ke bagan. Skor dan pemenang dikosongkan karena pertemuannya berubah. */
export function applyDraw(section: KnockoutSection, result: string[]): KnockoutSection {
  const next = structuredClone(section);
  playerPositions(next).forEach(({ index, side }, i) => {
    next.matches[index][side] = { kind: "player", name: result[i] };
  });
  for (const m of next.matches) {
    m.scoreA = "";
    m.scoreB = "";
    m.winner = null;
  }
  return next;
}

export type DrawCheck = { reproducible: boolean; matchesBracket: boolean };

/** Dipakai di browser: hitung ulang dari kode undian dan bandingkan dengan bagan saat ini. */
export function verifyDraw(draw: Pick<DrawRecord, "seed" | "players" | "result">, section: KnockoutSection | null): DrawCheck {
  let recomputed: string[] = [];
  try {
    recomputed = seededShuffle(canonicalOrder(draw.players), draw.seed);
  } catch {
    return { reproducible: false, matchesBracket: false };
  }
  const reproducible =
    recomputed.length === draw.result.length && recomputed.every((n, i) => n === draw.result[i]) &&
    canonicalOrder(draw.players).every((n, i) => n === draw.players[i]);
  const now = section ? currentAssignment(section) : [];
  const matchesBracket = now.length === draw.result.length && now.every((n, i) => n === draw.result[i]);
  return { reproducible, matchesBracket };
}
