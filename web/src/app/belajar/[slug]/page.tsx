import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LessonExercises } from "@/components/learn/lesson-exercises";
import { LessonContent } from "@/components/learn/markdown";
import { buttonClass, Container } from "@/components/ui";
import { getLesson, listLessons } from "@/lib/queries";
import { CHAPTERS } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const lessons = await listLessons();
  return lessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/belajar/[slug]">): Promise<Metadata> {
  const lesson = await getLesson((await params).slug);
  return lesson ? { title: lesson.title, description: lesson.summary } : {};
}

export default async function LessonPage({ params }: PageProps<"/belajar/[slug]">) {
  const { slug } = await params;
  const [lesson, all] = await Promise.all([getLesson(slug), listLessons()]);
  if (!lesson) notFound();

  const index = all.findIndex((l) => l.id === lesson.id);
  const prev = all[index - 1];
  const next = all[index + 1];

  return (
    <Container className="max-w-4xl pb-12">
      <header className="py-8">
        <Link href="/belajar" className="text-sm font-semibold text-copper hover:underline">
          Bab {lesson.chapter}: {CHAPTERS[lesson.chapter]}
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-muted">{lesson.summary}</p>
      </header>

      <LessonContent markdown={lesson.content_md} />

      <h2 className="mb-4 mt-10 text-2xl">Latihan</h2>
      <LessonExercises lessonId={lesson.id} exercises={lesson.exercises} />

      <nav aria-label="Materi lain" className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/belajar/${prev.slug}`} className={buttonClass("secondary", "md", "justify-start text-left")}>
            <ChevronLeft size={18} className="shrink-0" aria-hidden />
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/belajar/${next.slug}`} className={buttonClass("primary", "md", "justify-end text-right")}>
            <span className="truncate">{next.title}</span>
            <ChevronRight size={18} className="shrink-0" aria-hidden />
          </Link>
        )}
      </nav>
    </Container>
  );
}
