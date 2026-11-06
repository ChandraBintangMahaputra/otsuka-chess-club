export type Exercise = {
  fen: string;
  prompt: string;
  /** Jawaban benar dalam SAN, mis. "Qh7#". */
  answers: string[];
  explanation: string;
  hint?: string;
};

export type Lesson = {
  id: string;
  slug: string;
  chapter: number;
  position: number;
  title: string;
  summary: string;
  content_md: string;
  exercises: Exercise[];
};

export type Opening = {
  id: string;
  slug: string;
  name: string;
  eco: string;
  side: "white" | "black";
  level: "pemula" | "menengah";
  first_move: string;
  pgn: string;
  move_notes: Record<string, string>;
  ideas_md: string;
  parent_id: string | null;
  family: string;
  is_curated: boolean;
};

export type OpeningCard = Pick<
  Opening,
  "id" | "slug" | "name" | "eco" | "side" | "level" | "first_move" | "is_curated"
> & { final_fen: string };

export type Puzzle = {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
};

export type Standing = { name: string; points: number };

export type Activity = {
  id: string;
  slug: string;
  title: string;
  category: "turnamen" | "latihan" | "gathering" | "lainnya";
  held_on: string;
  location: string;
  description_md: string;
  cover_path: string;
  photo_paths: string[];
  standings: Standing[] | null;
  pgn: string | null;
};

export const CHAPTERS: Record<number, string> = {
  1: "Mengenal papan",
  2: "Gerak bidak",
  3: "Makan bidak dan nilai bidak",
  4: "Langkah khusus",
  5: "Skak, skakmat, dan pat",
  6: "Cara remis lainnya",
  7: "Prinsip pembukaan",
  8: "Skakmat dasar",
  9: "Taktik dasar",
};

export const CATEGORY_LABEL: Record<Activity["category"], string> = {
  turnamen: "Turnamen",
  latihan: "Latihan",
  gathering: "Gathering",
  lainnya: "Lainnya",
};

export const PUZZLE_THEMES: { value: string; label: string }[] = [
  { value: "mateIn1", label: "Mat dalam 1" },
  { value: "mateIn2", label: "Mat dalam 2" },
  { value: "mateIn3", label: "Mat dalam 3" },
  { value: "fork", label: "Garpu" },
  { value: "pin", label: "Pin" },
  { value: "skewer", label: "Skewer" },
  { value: "discoveredAttack", label: "Serangan terbuka" },
  { value: "doubleCheck", label: "Skak ganda" },
  { value: "hangingPiece", label: "Bidak tak terjaga" },
  { value: "backRankMate", label: "Mat baris belakang" },
  { value: "sacrifice", label: "Pengorbanan" },
  { value: "deflection", label: "Pengalihan" },
  { value: "attraction", label: "Pemancingan" },
  { value: "promotion", label: "Promosi" },
  { value: "endgame", label: "Akhir permainan" },
];

export const PUZZLE_LEVELS: { value: string; label: string; min: number; max: number }[] = [
  { value: "pemula", label: "Pemula (di bawah 1000)", min: 0, max: 999 },
  { value: "menengah", label: "Menengah (1000–1599)", min: 1000, max: 1599 },
  { value: "mahir", label: "Mahir (1600–2199)", min: 1600, max: 2199 },
  { value: "master", label: "Master (2200 ke atas)", min: 2200, max: 4000 },
];

const EXTRA_THEME_LABELS: Record<string, string> = {
  advantage: "Unggul",
  crushing: "Unggul telak",
  equality: "Menyamakan",
  mate: "Mat",
  mateIn4: "Mat dalam 4",
  mateIn5: "Mat dalam 5",
  opening: "Pembukaan",
  middlegame: "Tengah permainan",
  kingsideAttack: "Serangan sayap Raja",
  queensideAttack: "Serangan sayap Menteri",
  advancedPawn: "Pion maju",
  attackingF2F7: "Serangan f2/f7",
  capturingDefender: "Makan penjaga",
  clearance: "Pengosongan",
  defensiveMove: "Langkah bertahan",
  enPassant: "En passant",
  exposedKing: "Raja terbuka",
  interference: "Interferensi",
  intermezzo: "Langkah sela",
  quietMove: "Langkah tenang",
  trappedPiece: "Bidak terperangkap",
  xRayAttack: "Serangan sinar-X",
  zugzwang: "Zugzwang",
  castling: "Rokade",
  underPromotion: "Promosi rendah",
  rookEndgame: "Akhir Benteng",
  pawnEndgame: "Akhir pion",
  queenEndgame: "Akhir Menteri",
  bishopEndgame: "Akhir Gajah",
  knightEndgame: "Akhir Kuda",
  queenRookEndgame: "Akhir Menteri dan Benteng",
  smotheredMate: "Mat tercekik",
  anastasiaMate: "Mat Anastasia",
  arabianMate: "Mat Arab",
  bodenMate: "Mat Boden",
  doubleBishopMate: "Mat dua Gajah",
  dovetailMate: "Mat dovetail",
  hookMate: "Mat kait",
};

export function themeLabel(theme: string) {
  const known = PUZZLE_THEMES.find((t) => t.value === theme)?.label ?? EXTRA_THEME_LABELS[theme];
  if (known) return known;
  return theme.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
