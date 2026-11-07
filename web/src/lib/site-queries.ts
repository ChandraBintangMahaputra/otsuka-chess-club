import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { defaultSettings } from "@/content/landing";
import { sql } from "./db";
import { settingsSchema, type LandingItem, type SiteSettings } from "./site-content";

export const SITE_SETTINGS_TAG = "site-settings";

/**
 * Dipakai layout di semua halaman. Disimpan di cache Next.js agar halaman dinamis
 * tidak menunggu database hanya untuk footer. Cache diperbarui saat admin menyimpan.
 */
const loadSettings = unstable_cache(
  async (): Promise<SiteSettings | null> => {
    const rows = await sql`select value from site_settings where key = 'landing'`;
    const parsed = settingsSchema.safeParse(rows[0]?.value);
    return parsed.success ? parsed.data : null;
  },
  [SITE_SETTINGS_TAG],
  { tags: [SITE_SETTINGS_TAG], revalidate: 3600 },
);

/** Kegagalan database tidak boleh menjatuhkan website, jadi ada isi cadangan. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return (await loadSettings()) ?? defaultSettings;
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
