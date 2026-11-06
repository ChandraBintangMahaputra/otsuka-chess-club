/** Aturan impor database opening Lichess (CC0, github.com/lichess-org/chess-openings). */

export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "Sicilian Defense: Najdorf Variation" menjadi "Sicilian Defense". */
export const familyOf = (name: string) => name.split(":")[0].trim();

/** Data Lichess tidak mencatat sisi. Perkiraan dari nama: pertahanan dan jawaban gambit untuk Hitam. */
export function guessSide(name: string): "white" | "black" {
  return /Defen[cs]e|Declined|Accepted|Counter-?[Gg]ambit/.test(familyOf(name)) ? "black" : "white";
}

export function parseTsv(text: string) {
  return text
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const [eco, name, pgn] = line.split("\t");
      return { eco, name, pgn };
    });
}
