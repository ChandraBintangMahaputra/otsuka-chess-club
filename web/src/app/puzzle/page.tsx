import type { Metadata } from "next";
import { PuzzleTrainer } from "@/components/puzzle/puzzle-trainer";
import { Container, PageHeader } from "@/components/ui";
import { formatTanggal, todayWib } from "@/lib/date";
import { getDailyPuzzle } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Puzzle",
  description: "Latih taktik dengan puzzle harian dan puzzle acak.",
};

export default async function PuzzlePage() {
  const daily = await getDailyPuzzle();
  return (
    <Container className="pb-12">
      <PageHeader title="Puzzle" description="Temukan langkah terbaik. Lawan melangkah dulu, lalu giliranmu." />
      <PuzzleTrainer initial={daily} title={`Puzzle harian, ${formatTanggal(todayWib())}`} />
    </Container>
  );
}
