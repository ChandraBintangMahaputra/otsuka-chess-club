import type { MetadataRoute } from "next";
import { listPosts } from "@/lib/post-queries";
import { listTournaments } from "@/lib/tournament-queries";
import { listActivities, listCuratedOpeningSlugs, listLessons } from "@/lib/queries";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const [lessons, openings, activities, kegiatan, artikel, turnamen] = await Promise.all([
    listLessons(),
    listCuratedOpeningSlugs(),
    listActivities(),
    listPosts("kegiatan"),
    listPosts("artikel"),
    listTournaments(),
  ]);
  const paths = [
    "/",
    "/belajar",
    "/opening",
    "/puzzle",
    "/kegiatan",
    "/artikel",
    "/dokumentasi",
    "/turnamen",
    ...lessons.map((l) => `/belajar/${l.slug}`),
    ...openings.map((slug) => `/opening/${slug}`),
    ...activities.map((a) => `/dokumentasi/${a.slug}`),
    ...kegiatan.map((p) => `/kegiatan/${p.slug}`),
    ...artikel.map((p) => `/artikel/${p.slug}`),
    ...turnamen.map((t) => `/turnamen/${t.slug}`),
  ];
  return paths.map((p) => ({ url: `${base}${p}` }));
}
