import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, Compass, Puzzle, Swords, UsersRound } from "lucide-react";
import { StaticBoard } from "@/components/chess/static-board";
import { ActivityCard } from "@/components/learn/activity-card";
import { PostGrid } from "@/components/learn/post-views";
import { HeroCta } from "@/components/site/nav";
import { buttonClass, Container } from "@/components/ui";
import { listPosts } from "@/lib/post-queries";
import { getDailyPuzzle, listActivities } from "@/lib/queries";
import { getSiteSettings, listLandingItems } from "@/lib/site-queries";

export const revalidate = 3600;

const STUDY_ICONS: Record<string, typeof BookOpen> = {
  "/belajar": BookOpen,
  "/opening": Swords,
  "/puzzle": Puzzle,
};

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="text-sm font-semibold text-copper">{eyebrow}</p>}
      <h2 className="mt-1 text-3xl">{title}</h2>
    </div>
  );
}

function SectionHeader({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <SectionTitle eyebrow={eyebrow} title={title} />
      <Link href={href} className="mb-6 flex shrink-0 items-center gap-1 font-semibold text-forest hover:underline">
        Lihat semua <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [settings, items, kegiatan, artikel, recent, daily] = await Promise.all([
    getSiteSettings(),
    listLandingItems(),
    listPosts("kegiatan", 3),
    listPosts("artikel", 3),
    listActivities(3),
    getDailyPuzzle(),
  ]);
  const { hero, about, sections } = settings;

  return (
    <>
      <section className="bg-forest-deep text-on-forest">
        <Container className="grid items-center gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-on-forest/75">{hero.eyebrow}</p>
            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">{hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg text-on-forest/85">{hero.tagline}</p>
            <div className="mt-8">
              <HeroCta />
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm md:max-w-md">
            <StaticBoard
              fen={hero.boardFen}
              highlight={hero.boardHighlight.split(/\s+/).filter(Boolean)}
              label={hero.boardCaption || "Posisi catur"}
              className="shadow-2xl ring-4 ring-white/10"
            />
            {hero.boardCaption && <p className="mt-3 text-sm text-on-forest/75">{hero.boardCaption}</p>}
          </div>
        </Container>
      </section>

      <Container className="space-y-16 py-14">
        <section className="grid gap-8 md:grid-cols-2">
          <div>
            <SectionTitle eyebrow={about.eyebrow} title={about.title} />
            <p className="max-w-prose whitespace-pre-line">{about.body}</p>
          </div>
          {(about.vision || about.memberCount !== null) && (
            <div className="self-end rounded-xl border-l-4 border-copper bg-surface p-5">
              {about.vision && (
                <>
                  <p className="text-sm font-semibold text-muted">Visi</p>
                  <p className="mt-1 font-display text-xl">{about.vision}</p>
                </>
              )}
              {about.memberCount !== null && (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
                  <UsersRound size={18} aria-hidden /> {about.memberCount} anggota
                </p>
              )}
            </div>
          )}
        </section>

        {kegiatan.length > 0 && (
          <section>
            <SectionHeader {...sections.kegiatan} href="/kegiatan" />
            <PostGrid posts={kegiatan} />
          </section>
        )}

        {artikel.length > 0 && (
          <section>
            <SectionHeader {...sections.artikel} href="/artikel" />
            <PostGrid posts={artikel} />
          </section>
        )}

        {recent.length > 0 && (
          <section>
            <SectionHeader {...sections.dokumentasi} href="/dokumentasi" />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((a) => (
                <li key={a.id}>
                  <ActivityCard activity={a} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {items.belajar.length > 0 && (
          <section>
            <SectionTitle {...sections.belajar} />
            <ul className="grid gap-4 md:grid-cols-3">
              {items.belajar.map((card) => {
                const Icon = STUDY_ICONS[card.href ?? ""] ?? Compass;
                return (
                  <li key={card.id}>
                    <Link
                      href={card.href ?? "/"}
                      className="group block h-full rounded-xl bg-forest p-5 text-on-forest transition-colors duration-150 hover:bg-forest-deep"
                    >
                      <Icon aria-hidden />
                      <h3 className="mt-3 text-xl">{card.title}</h3>
                      <p className="mt-1 text-on-forest/85">{card.body}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {daily && (
          <section className="grid items-center gap-6 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[14rem_1fr] sm:p-8">
            <StaticBoard
              fen={daily.fen}
              coordinates={false}
              flipped={daily.fen.split(" ")[1] === "w"}
              label="Posisi puzzle harian"
            />
            <div>
              <p className="text-sm font-semibold text-copper">{sections.puzzle.eyebrow}</p>
              <h2 className="mt-1 text-2xl">{sections.puzzle.title}</h2>
              <p className="mt-2 text-muted">{sections.puzzle.body}</p>
              <Link href="/puzzle" className={buttonClass("primary", "md", "mt-4")}>
                Coba sekarang
              </Link>
            </div>
          </section>
        )}

        {items.faq.length > 0 && (
          <section className="max-w-3xl">
            <SectionTitle {...sections.faq} />
            <div className="divide-y divide-line rounded-xl border border-line bg-surface">
              {items.faq.map((f) => (
                <details key={f.id} className="group p-4">
                  <summary className="flex min-h-8 list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                    {f.title}
                    <ChevronDown
                      size={18}
                      className="shrink-0 transition-transform duration-150 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-2 text-muted">{f.body}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
