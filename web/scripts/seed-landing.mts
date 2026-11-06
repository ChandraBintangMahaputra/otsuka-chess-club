import { connect } from "./_db.mts";
import { defaultItems, defaultSettings } from "../src/content/landing.ts";

/** Mengisi master beranda sekali. Isi yang sudah diubah admin tidak ditimpa. */
const sql = connect();

await sql`
  insert into site_settings (key, value) values ('landing', ${sql.json(defaultSettings as never)})
  on conflict (key) do nothing`;

const [{ count }] = await sql`select count(*)::int as count from landing_items`;
if (count === 0) {
  const position = new Map<string, number>();
  for (const item of defaultItems) {
    const next = (position.get(item.section) ?? 0) + 1;
    position.set(item.section, next);
    await sql`
      insert into landing_items (section, title, body, href, position)
      values (${item.section}, ${item.title}, ${item.body}, ${item.href ?? null}, ${next})`;
  }
}

const rows = await sql`select section, count(*)::int as total from landing_items group by 1 order by 1`;
console.table(rows);
await sql.end();
