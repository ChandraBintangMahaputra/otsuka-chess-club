import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Chess } from "chess.js";
import { connect } from "./_db.mts";
import { familyOf, guessSide, parseTsv, slugify } from "../src/lib/opening-import.ts";

/**
 * Mengimpor opening Lichess sebagai referensi tanpa penjelasan.
 * Aman diulang: baris yang sudah punya penjelasan (is_curated) tidak disentuh.
 */
const DIR = "data/lichess-openings";
const sql = connect();

const curated = await sql`select slug, name from openings where is_curated`;
const curatedNames = new Set(curated.map((c) => c.name));
const used = new Set<string>(curated.map((c) => c.slug));

const rows = [];
let skipped = 0;
const files = readdirSync(DIR).filter((f) => f.endsWith(".tsv")).sort();

for (const file of files) {
  for (const r of parseTsv(readFileSync(path.join(DIR, file), "utf8"))) {
    if (curatedNames.has(r.name)) {
      skipped += 1;
      continue;
    }
    const game = new Chess();
    game.loadPgn(r.pgn);

    // Nama yang sama bisa muncul untuk beberapa urutan langkah.
    const base = slugify(r.name);
    let slug = base;
    for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;
    used.add(slug);

    rows.push({
      slug,
      name: r.name,
      eco: r.eco,
      side: guessSide(r.name),
      level: "menengah",
      first_move: `1.${game.history()[0]}`,
      pgn: r.pgn,
      final_fen: game.fen(),
      family: familyOf(r.name),
      is_curated: false,
      is_published: true,
    });
  }
}

for (let i = 0; i < rows.length; i += 500) {
  await sql`
    insert into openings ${sql(rows.slice(i, i + 500))}
    on conflict (slug) do update set
      name = excluded.name, eco = excluded.eco, side = excluded.side, first_move = excluded.first_move,
      pgn = excluded.pgn, final_fen = excluded.final_fen, family = excluded.family
    where not openings.is_curated`;
}

const [c] = await sql`
  select count(*)::int as total, count(*) filter (where is_curated)::int as curated from openings`;
console.log({ imported: rows.length, skippedCurated: skipped, ...c });
await sql.end();
