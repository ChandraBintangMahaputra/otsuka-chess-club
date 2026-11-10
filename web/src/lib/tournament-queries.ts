import "server-only";
import { sql } from "./db";
import type { DrawRecord } from "./draw";
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

export async function listDraws(tournamentId: string): Promise<DrawRecord[]> {
  const rows = await sql`
    select d.id, d.section_index, d.section_title, d.seed, d.players, d.result, d.created_at,
           coalesce(u.full_name, 'Admin') as created_by
    from tournament_draws d left join users u on u.id = d.created_by
    where d.tournament_id = ${tournamentId}
    order by d.created_at`;
  return rows.map((r) => ({
    id: r.id,
    sectionIndex: r.section_index,
    sectionTitle: r.section_title,
    seed: r.seed,
    players: r.players,
    result: r.result,
    createdBy: r.created_by,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}
