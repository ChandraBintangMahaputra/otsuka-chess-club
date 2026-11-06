import { notFound } from "next/navigation";
import { PuzzleTrainer } from "@/components/puzzle/puzzle-trainer";
import { Container, PageHeader } from "@/components/ui";
import { getPuzzle } from "@/lib/queries";

export const revalidate = 86400;
export const metadata = { title: "Puzzle" };

export async function generateStaticParams() {
  return [];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PuzzleDetailPage({ params }: PageProps<"/puzzle/[id]">) {
  const { id } = await params;
  const puzzle = UUID.test(id) ? await getPuzzle(id) : null;
  if (!puzzle) notFound();

  return (
    <Container className="pb-12">
      <PageHeader title="Puzzle" description="Temukan langkah terbaik. Lawan melangkah dulu, lalu giliranmu." />
      <PuzzleTrainer initial={puzzle} title="Puzzle pilihan" />
    </Container>
  );
}
