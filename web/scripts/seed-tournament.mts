import { connect } from "./_db.mts";
import { posterTournament } from "../src/lib/tournament.ts";

// Mengisi turnamen sesuai poster (Senin sampai Jumat) bila slug-nya belum ada.
const sql = connect();
const t = posterTournament();
const rows = await sql`
  insert into tournaments (slug, title, subtitle, data, is_published)
  values (${t.slug}, ${t.title}, ${t.subtitle}, ${sql.json(t.data as never)}, ${t.isPublished})
  on conflict (slug) do nothing returning id`;
console.log(rows.length ? `Turnamen dibuat: ${rows[0].id}` : "Turnamen sudah ada, tidak diubah.");
await sql.end();
