import "server-only";
import { sql } from "./db";
import type { Tournament, TournamentData } from "./tournament";

type Row = { id: string; slug: string; title: string; subtitle: string; is_published: boolean; data: TournamentData };

const toTournament = (r: Row): Tournament => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  subtitle: r.subtitle,
  isPublished: r.is_published,
  data: r.data,
});

export async function listTournaments(publishedOnly = true) {
  const rows = await sql`
    select id, slug, title, subtitle, is_published, data, updated_at
    from tournaments where ${publishedOnly ? sql`is_published` : sql`true`}
    order by created_at desc`;
  return (rows as unknown as (Row & { updated_at: Date })[]).map((r) => ({ ...toTournament(r), updatedAt: r.updated_at }));
}

export async function getTournamentBySlug(slug: string) {
  const rows = await sql`
    select id, slug, title, subtitle, is_published, data from tournaments
    where slug = ${slug} and is_published`;
  return rows[0] ? toTournament(rows[0] as unknown as Row) : null;
}

export async function getTournamentById(id: string) {
  const rows = await sql`select id, slug, title, subtitle, is_published, data from tournaments where id = ${id}`;
  return rows[0] ? toTournament(rows[0] as unknown as Row) : null;
}
