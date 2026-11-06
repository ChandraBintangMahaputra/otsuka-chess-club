import { describe, expect, it } from "vitest";
import { defaultItems, defaultSettings } from "@/content/landing";
import { landingItemSchema, settingsSchema } from "./site-content";

describe("master beranda", () => {
  it("isi awal lolos validasi", () => {
    expect(settingsSchema.safeParse(defaultSettings).success).toBe(true);
    defaultItems.forEach((item, i) => {
      const r = landingItemSchema.safeParse({ ...item, href: item.href ?? "", position: i + 1 });
      expect(r.success, item.title).toBe(true);
    });
  });

  it("menolak FEN hero yang rusak", () => {
    const bad = { ...defaultSettings, hero: { ...defaultSettings.hero, boardFen: "bukan fen" } };
    expect(settingsSchema.safeParse(bad).success).toBe(false);
  });

  it("menolak tautan kontak berbahaya", () => {
    const withHref = (contactHref: string) => ({
      ...defaultSettings,
      footer: { ...defaultSettings.footer, contactHref },
    });
    expect(settingsSchema.safeParse(withHref("javascript:alert(1)")).success).toBe(false);
    expect(settingsSchema.safeParse(withHref("https://chat.whatsapp.com/abc")).success).toBe(true);
    expect(settingsSchema.safeParse(withHref("mailto:klub@kantor.co.id")).success).toBe(true);
  });

  it("kartu belajar hanya boleh ke path internal", () => {
    const card = { section: "belajar", title: "A", body: "", position: 1 };
    expect(landingItemSchema.safeParse({ ...card, href: "/belajar" }).success).toBe(true);
    expect(landingItemSchema.safeParse({ ...card, href: "//evil.com" }).success).toBe(false);
    expect(landingItemSchema.safeParse({ ...card, href: "" }).success).toBe(false);
  });
});
