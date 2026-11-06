import "server-only";
import { cache } from "react";
import { defaultSettings } from "@/content/landing";
import { sql } from "./db";
import { settingsSchema, type LandingItem, type SiteSettings } from "./site-content";

/** Dipakai layout di semua halaman, jadi kegagalan database tidak boleh menjatuhkan website. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await sql`select value from site_settings where key = 'landing'`;
    const parsed = settingsSchema.safeParse(rows[0]?.value);
    return parsed.success ? parsed.data : defaultSettings;
  } catch (e) {
    console.error(e);
    return defaultSettings;
  }
});

export async function listLandingItems() {
  const rows = await sql`
    select id, section, title, body, href, position, is_published
    from landing_items where is_published order by position, title`;
  const items = rows as unknown as LandingItem[];
  return {
    belajar: items.filter((i) => i.section === "belajar"),
    faq: items.filter((i) => i.section === "faq"),
  };
}
