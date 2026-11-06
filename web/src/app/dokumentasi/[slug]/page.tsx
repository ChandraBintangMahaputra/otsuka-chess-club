import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { GameViewer } from "@/components/chess/game-viewer";
import { Gallery } from "@/components/learn/gallery";
import { Markdown } from "@/components/learn/markdown";
import { Badge, Container } from "@/components/ui";
import { formatTanggal } from "@/lib/date";
import { getActivity, listActivities } from "@/lib/queries";
import { CATEGORY_LABEL } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const activities = await listActivities();
  return activities.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/dokumentasi/[slug]">): Promise<Metadata> {
  const activity = await getActivity((await params).slug);
  return activity ? { title: activity.title } : {};
}

export default async function ActivityPage({ params }: PageProps<"/dokumentasi/[slug]">) {
  const { slug } = await params;
  const a = await getActivity(slug);
  if (!a) notFound();

  return (
    <Container className="max-w-5xl pb-12">
      <header className="py-8">
        <Link href="/dokumentasi" className="text-sm font-semibold text-copper hover:underline">
          Semua kegiatan
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">{a.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <Badge tone="forest">{CATEGORY_LABEL[a.category]}</Badge>
          <span className="flex items-center gap-1">
            <CalendarDays size={16} aria-hidden /> {formatTanggal(a.held_on)}
          </span>
          {a.location && (
            <span className="flex items-center gap-1">
              <MapPin size={16} aria-hidden /> {a.location}
            </span>
          )}
        </div>
      </header>

      <Markdown text={a.description_md} />

      {a.photo_paths.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-2xl">Galeri</h2>
          <Gallery photos={a.photo_paths} title={a.title} />
        </section>
      )}

      {a.standings && a.standings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-2xl">Peringkat</h2>
          <div className="max-w-md overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-left">
              <thead className="bg-paper text-sm text-muted">
                <tr>
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">Nama</th>
                  <th className="p-3 text-right font-semibold">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {a.standings.map((s, i) => (
                  <tr key={s.name}>
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-right tabular-nums">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {a.pgn && (
        <section className="mt-10">
          <h2 className="mb-3 text-2xl">Partai final</h2>
          <GameViewer pgn={a.pgn} />
        </section>
      )}
    </Container>
  );
}
