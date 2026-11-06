import { readFileSync } from "node:fs";
import { connect } from "./_db.mts";

const sql = connect();
await sql.unsafe(readFileSync("supabase/schema.sql", "utf8"));
const rows = await sql`
  select c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' order by 1`;
console.table(rows);
await sql.end();
