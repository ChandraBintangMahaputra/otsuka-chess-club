"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  emptyKnockout,
  posterTournament,
  tournamentDataSchema,
  tournamentMetaSchema,
  type TournamentData,
} from "@/lib/tournament";

const uuid = z.string().uuid();

function refresh() {
  revalidatePath("/turnamen");
  revalidatePath("/turnamen/[slug]", "page");
  revalidatePath("/admin/turnamen");
}

const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";

export async function createTournamentAction(template: "poster" | "kosong") {
  await requireAdmin();
  const base =
    template === "poster"
      ? posterTournament()
      : {
          slug: "turnamen",
          title: "Turnamen baru",
          subtitle: "",
          isPublished: false,
          data: { footnote: "", sections: [emptyKnockout()] } satisfies TournamentData,
        };
  // Slug unik: tambahkan angka bila sudah dipakai.
  const taken = new Set((await sql`select slug from tournaments`).map((r) => r.slug as string));
  let slug = base.slug;
  for (let i = 2; taken.has(slug); i++) slug = `${base.slug}-${i}`;
  const [row] = await sql`
    insert into tournaments (slug, title, subtitle, data, is_published)
    values (${slug}, ${base.title}, ${base.subtitle}, ${sql.json(base.data as never)}, false)
    returning id`;
  refresh();
  return row.id as string;
}

export type SaveTournamentInput = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  isPublished: boolean;
  data: TournamentData;
};

export async function saveTournamentAction(input: SaveTournamentInput): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = uuid.safeParse(input.id);
  const meta = tournamentMetaSchema.safeParse(input);
  if (!id.success || !meta.success) return { ok: false, error: meta.error?.issues[0]?.message ?? "Data tidak valid" };
  const data = tournamentDataSchema.safeParse(input.data);
  if (!data.success) return { ok: false, error: data.error.issues[0]?.message ?? "Bagan tidak valid" };

  try {
    await sql`
      update tournaments set title = ${meta.data.title}, slug = ${meta.data.slug}, subtitle = ${meta.data.subtitle},
        data = ${sql.json(data.data as never)}, is_published = ${Boolean(input.isPublished)}, updated_at = now()
      where id = ${id.data}`;
  } catch (e) {
    if (isUnique(e)) return { ok: false, error: "Slug sudah dipakai turnamen lain" };
    throw e;
  }
  refresh();
  return { ok: true };
}

export async function deleteTournamentAction(id: string) {
  await requireAdmin();
  await sql`delete from tournaments where id = ${uuid.parse(id)}`;
  refresh();
}
