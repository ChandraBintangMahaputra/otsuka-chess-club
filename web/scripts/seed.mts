import { Chess } from "chess.js";
import { connect } from "./_db.mts";
import { familyOf } from "../src/lib/opening-import.ts";
import { lessons } from "../src/content/lessons.ts";
import { openings } from "../src/content/openings.ts";
import { activities, photoPaths } from "../src/content/activities.ts";

/** Menulis ulang konten bawaan berdasarkan slug. Baris baru dari admin tidak terganggu. */
const sql = connect();

for (const l of lessons) {
  await sql`
    insert into lessons (slug, chapter, position, title, summary, content_md, exercises, is_published)
    values (${l.slug}, ${l.chapter}, ${l.position}, ${l.title}, ${l.summary}, ${l.content_md},
            ${sql.json(l.exercises as never)}, true)
    on conflict (slug) do update set
      chapter = excluded.chapter, position = excluded.position, title = excluded.title,
      summary = excluded.summary, content_md = excluded.content_md, exercises = excluded.exercises,
      updated_at = now()`;
}

for (const o of openings) {
  const game = new Chess();
  game.loadPgn(o.pgn);
  await sql`
    insert into openings (slug, name, eco, side, level, first_move, pgn, move_notes, ideas_md, is_published,
                          final_fen, family, is_curated)
    values (${o.slug}, ${o.name}, ${o.eco}, ${o.side}, ${o.level}, ${o.first_move}, ${o.pgn},
            ${sql.json(o.move_notes)}, ${o.ideas_md}, true, ${game.fen()}, ${familyOf(o.name)}, true)
    on conflict (slug) do update set
      name = excluded.name, eco = excluded.eco, side = excluded.side, level = excluded.level,
      first_move = excluded.first_move, pgn = excluded.pgn, move_notes = excluded.move_notes,
      ideas_md = excluded.ideas_md, final_fen = excluded.final_fen, family = excluded.family,
      is_curated = true`;
}
for (const o of openings.filter((x) => x.parent)) {
  await sql`
    update openings set parent_id = (select id from openings where slug = ${o.parent!})
    where slug = ${o.slug}`;
}

for (const a of activities) {
  const photos = photoPaths(a);
  await sql`
    insert into activities (slug, title, category, held_on, location, description_md, cover_path,
                            photo_paths, standings, pgn, is_published)
    values (${a.slug}, ${a.title}, ${a.category}, ${a.held_on}, ${a.location}, ${a.description_md},
            ${photos[0]}, ${photos}, ${a.standings ? sql.json(a.standings) : null}, ${a.pgn ?? null}, true)
    on conflict (slug) do update set
      title = excluded.title, category = excluded.category, held_on = excluded.held_on,
      location = excluded.location, description_md = excluded.description_md,
      cover_path = excluded.cover_path, photo_paths = excluded.photo_paths,
      standings = excluded.standings, pgn = excluded.pgn`;
}

const [c] = await sql`
  select (select count(*) from lessons)::int as lessons, (select count(*) from openings)::int as openings,
         (select count(*) from activities)::int as activities`;
console.log(c);
await sql.end();
