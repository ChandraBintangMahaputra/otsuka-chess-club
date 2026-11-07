"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { AdminState } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { landingItemSchema, settingsSchema } from "@/lib/site-content";
import { SITE_SETTINGS_TAG } from "@/lib/site-queries";

/** Footer ada di layout, jadi semua halaman ikut diperbarui, termasuk cache pengaturan. */
const refreshSite = () => {
  updateTag(SITE_SETTINGS_TAG);
  revalidatePath("/", "layout");
};

export async function saveSiteSettingsAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const text = (key: string) => String(form.get(key) ?? "");
  const heading = (key: string) => ({ eyebrow: text(`${key}.eyebrow`), title: text(`${key}.title`) });
  const memberCount = text("about.memberCount").trim();
  const contactHref = text("footer.contactHref").trim();

  const parsed = settingsSchema.safeParse({
    hero: {
      eyebrow: text("hero.eyebrow"),
      title: text("hero.title"),
      tagline: text("hero.tagline"),
      boardFen: text("hero.boardFen"),
      boardHighlight: text("hero.boardHighlight"),
      boardCaption: text("hero.boardCaption"),
    },
    about: {
      ...heading("about"),
      body: text("about.body"),
      vision: text("about.vision"),
      memberCount: memberCount ? Number(memberCount) : null,
    },
    sections: {
      kegiatan: heading("sections.kegiatan"),
      artikel: heading("sections.artikel"),
      dokumentasi: heading("sections.dokumentasi"),
      belajar: heading("sections.belajar"),
      puzzle: { ...heading("sections.puzzle"), body: text("sections.puzzle.body") },
      faq: heading("sections.faq"),
    },
    footer: {
      text: text("footer.text"),
      contactLabel: text("footer.contactLabel"),
      contactHref: contactHref || null,
    },
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  await sql`
    insert into site_settings (key, value) values ('landing', ${sql.json(parsed.data as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  refreshSite();
  return { success: "Isi beranda tersimpan." };
}

export async function saveLandingItemAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = landingItemSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const d = parsed.data;
  const href = d.section === "belajar" ? d.href : null;
  const published = form.get("is_published") === "on";
  const rawId = form.get("id");
  const id = typeof rawId === "string" && rawId ? z.string().uuid().parse(rawId) : null;

  if (id) {
    await sql`
      update landing_items set section = ${d.section}, title = ${d.title}, body = ${d.body}, href = ${href},
        position = ${d.position}, is_published = ${published}
      where id = ${id}`;
  } else {
    await sql`
      insert into landing_items (section, title, body, href, position, is_published)
      values (${d.section}, ${d.title}, ${d.body}, ${href}, ${d.position}, ${published})`;
  }
  refreshSite();
  return { success: "Item tersimpan.", redirectTo: "/admin/beranda" };
}

export async function deleteLandingItemAction(id: string) {
  await requireAdmin();
  await sql`delete from landing_items where id = ${z.string().uuid().parse(id)}`;
  refreshSite();
}
