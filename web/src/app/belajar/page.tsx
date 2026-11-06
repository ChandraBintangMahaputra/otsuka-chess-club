import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LessonStatus } from "@/components/learn/lesson-status";
import { Container, PageHeader } from "@/components/ui";
import { listLessons } from "@/lib/queries";
import { CHAPTERS } from "@/lib/types";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Belajar Dasar",
  description: "Materi catur dari nol: papan, gerak bidak, sampai taktik dasar.",
};

export default async function BelajarPage() {
  const lessons = await listLessons();
  const chapters = [...new Set(lessons.map((l) => l.chapter))];

  return (
    <Container className="pb-12">
      <PageHeader
        title="Belajar Dasar"
        description="Baca berurutan dari Bab 1. Setiap materi punya contoh di papan dan latihan singkat."
      />
      <ol className="space-y-6">
        {chapters.map((chapter) => (
          <li key={chapter} className="grid gap-3 md:grid-cols-[14rem_1fr]">
            <div>
              <p className="text-sm font-semibold text-copper">Bab {chapter}</p>
              <h2 className="text-xl">{CHAPTERS[chapter]}</h2>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {lessons
                .filter((l) => l.chapter === chapter)
                .map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/belajar/${l.slug}`}
                      className="flex min-h-16 items-center gap-3 p-4 transition-colors duration-150 hover:bg-paper"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{l.title}</span>
                        <span className="block text-sm text-muted">{l.summary}</span>
                      </span>
                      <LessonStatus lessonId={l.id} />
                      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ol>
    </Container>
  );
}
