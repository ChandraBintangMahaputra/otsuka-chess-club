import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { Container, PageHeader } from "@/components/ui";
import { championOf, type KnockoutSection } from "@/lib/tournament";
import { listTournaments } from "@/lib/tournament-queries";

export const revalidate = 60;
export const metadata: Metadata = { title: "Turnamen", description: "Bagan dan hasil turnamen catur internal." };

export default async function TurnamenPage() {
  const list = await listTournaments();
  return (
    <Container className="max-w-4xl pb-12">
      <PageHeader title="Turnamen" description="Bagan pertandingan dan hasil terbaru turnamen klub." />
      {list.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-muted">Belum ada turnamen yang diumumkan.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {list.map((t) => {
            const ko = t.data.sections.find((s): s is KnockoutSection => s.kind === "knockout");
            const champion = ko ? championOf(ko) : null;
            return (
              <li key={t.id}>
                <Link href={`/turnamen/${t.slug}`} className="flex items-center justify-between gap-3 p-4 hover:bg-paper">
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.title}</span>
                    <span className="block text-sm text-muted">{t.subtitle}</span>
                    {champion && (
                      <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-copper">
                        <Trophy size={14} aria-hidden /> Juara: {champion}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
