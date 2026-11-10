import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TournamentView } from "@/components/tournament/tournament-view";
import { getTournamentBySlug } from "@/lib/tournament-queries";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/turnamen/[slug]">): Promise<Metadata> {
  const t = await getTournamentBySlug((await params).slug);
  return t ? { title: t.title, description: t.subtitle || "Bagan dan hasil turnamen catur." } : {};
}

export default async function TurnamenDetailPage({ params }: PageProps<"/turnamen/[slug]">) {
  const t = await getTournamentBySlug((await params).slug);
  if (!t) notFound();
  return <TournamentView t={t} />;
}
