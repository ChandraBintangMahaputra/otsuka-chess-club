import { connect } from "./_db.mts";
import { slugify } from "../src/lib/opening-import.ts";

/** Memindahkan kartu Kegiatan lama dari landing_items ke tabel posts. Aman diulang. */
const sql = connect();

const items = await sql`select title, body, position from landing_items where section = 'kegiatan' order by position`;
await sql.begin(async (tx) => {
  for (const item of items) {
    await tx`
      insert into posts (type, slug, title, excerpt, body_md, is_published)
      values ('kegiatan', ${slugify(item.title)}, ${item.title}, ${item.body}, ${item.body}, true)
      on conflict (type, slug) do nothing`;
  }
  await tx`delete from landing_items where section = 'kegiatan'`;
});

const rows = await sql`select type, count(*)::int as total from posts group by 1 order by 1`;
console.table(rows);
await sql.end();
