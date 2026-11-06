import { Chess } from "chess.js";
import { z } from "zod";

const required = (max = 300) => z.string().trim().min(1, "Kolom wajib diisi").max(max);

const heading = z.object({ eyebrow: z.string().trim().max(80), title: required(120) });

const internalPath = (v: string) => v.startsWith("/") && !v.startsWith("//") && !v.includes("\\");

function validFen(fen: string) {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

/** Isi beranda dan footer. Disimpan sebagai satu baris di tabel site_settings. */
export const settingsSchema = z.object({
  hero: z.object({
    eyebrow: z.string().trim().max(80),
    title: required(160),
    tagline: required(400),
    boardFen: required(120).refine(validFen, "FEN papan hero tidak valid"),
    boardHighlight: z.string().trim().max(40),
    boardCaption: z.string().trim().max(200),
  }),
  about: heading.extend({
    body: required(2000),
    vision: z.string().trim().max(400),
    memberCount: z.number().int().min(0).nullable(),
  }),
  sections: z.object({
    kegiatan: heading,
    // Baris lama belum punya bagian ini.
    artikel: heading.default({ eyebrow: "Bacaan", title: "Artikel terbaru" }),
    dokumentasi: heading,
    belajar: heading,
    puzzle: heading.extend({ body: z.string().trim().max(300) }),
    faq: heading,
  }),
  footer: z.object({
    text: required(200),
    contactLabel: z.string().trim().max(120),
    // Hanya tautan aman, agar tidak bisa diisi javascript:
    contactHref: z
      .string()
      .trim()
      .max(300)
      .regex(/^(https:\/\/|mailto:)/, "Tautan kontak harus diawali https:// atau mailto:")
      .nullable(),
  }),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

export const LANDING_SECTIONS = {
  belajar: "Mulai belajar",
  faq: "Pertanyaan umum",
} as const;

export type LandingSection = keyof typeof LANDING_SECTIONS;

export const landingItemSchema = z
  .object({
    section: z.enum(["belajar", "faq"]),
    title: required(200),
    body: z.string().trim().max(2000),
    href: z.string().trim().max(200),
    position: z.coerce.number().int().min(1).max(999),
  })
  .refine((d) => d.section !== "belajar" || internalPath(d.href), {
    path: ["href"],
    message: "Tautan harus path internal, mis. /belajar",
  });

export type LandingItem = {
  id: string;
  section: LandingSection;
  title: string;
  body: string;
  href: string | null;
  position: number;
  is_published: boolean;
};
