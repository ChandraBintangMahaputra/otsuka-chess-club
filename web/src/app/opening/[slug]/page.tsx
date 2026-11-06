import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpeningStudy } from "@/components/learn/opening-study";
import { Markdown } from "@/components/learn/markdown";
import { Badge, Container } from "@/components/ui";
import { getOpening, getOpeningRelations, listCuratedOpeningSlugs } from "@/lib/queries";

export const revalidate = 3600;

// Hanya opening lengkap dibuat saat build, sisanya dibuat saat pertama dibuka.
export async function generateStaticParams() {
  return (await listCuratedOpeningSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/opening/[slug]">): Promise<Metadata> {
  const opening = await getOpening((await params).slug);
  return opening ? { title: opening.name, description: `${opening.name} (${opening.eco})` } : {};
}

export default async function OpeningDetailPage({ params }: PageProps<"/opening/[slug]">) {
  const { slug } = await params;
  const opening = await getOpening(slug);
  if (!opening) notFound();

  const { parent, related, relatedTotal } = await getOpeningRelations(opening);

  return (
    <Container className="pb-12">
      <header className="py-8">
        <Link href="/opening" className="text-sm font-semibold text-copper hover:underline">
          Semua opening
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">{opening.name}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{opening.eco}</Badge>
          <Badge tone="forest">{opening.side === "white" ? "Untuk Putih" : "Untuk Hitam"}</Badge>
          {opening.is_curated && (
            <Badge tone="copper">{opening.level === "pemula" ? "Pemula" : "Menengah"}</Badge>
          )}
        </div>
        {parent && (
          <p className="mt-3 text-sm text-muted">
            Variasi dari{" "}
            <Link href={`/opening/${parent.slug}`} className="font-semibold text-forest underline">
              {parent.name}
            </Link>
          </p>
        )}
        {!opening.is_curated && (
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Opening ini baru berisi urutan langkah dari database Lichess, belum ada penjelasan per langkah.
          </p>
        )}
      </header>

      <OpeningStudy
        openingId={opening.id}
        pgn={opening.pgn}
        notes={opening.is_curated ? opening.move_notes : undefined}
        side={opening.side}
      />

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>{opening.ideas_md && <Markdown text={opening.ideas_md} />}</div>
        {related.length > 0 && (
          <aside>
            <h2 className="text-xl">Variasi terkait</h2>
            <ul className="mt-3 space-y-2">
              {related.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/opening/${v.slug}`}
                    className="block rounded-lg border border-line bg-surface p-3 font-semibold transition-colors duration-150 hover:border-forest"
                  >
                    {v.name}
                  </Link>
                </li>
              ))}
            </ul>
            {relatedTotal > related.length && (
              <Link
                href={`/opening?q=${encodeURIComponent(opening.family)}`}
                className="mt-3 inline-block text-sm font-semibold text-forest underline"
              >
                Lihat semua {relatedTotal.toLocaleString("id-ID")} variasi
              </Link>
            )}
          </aside>
        )}
      </section>
    </Container>
  );
}
