import type { Metadata } from "next";
import { OpeningCatalog } from "@/components/learn/opening-catalog";
import { Container, PageHeader } from "@/components/ui";
import { searchOpenings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Opening",
  description: "Katalog pembukaan catur dengan penjelasan langkah dan mode latihan.",
};

const text = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 100) : "");

export default async function OpeningPage({ searchParams }: PageProps<"/opening">) {
  const params = await searchParams;
  const filter = {
    q: text(params.q),
    side: text(params.side),
    level: text(params.level),
    first: text(params.first),
    notes: text(params.notes),
  };
  const { items, total } = await searchOpenings(filter);

  return (
    <Container className="pb-12">
      <PageHeader
        title="Opening"
        description="Ribuan pembukaan untuk ditelusuri. Yang berlabel Lengkap punya penjelasan di setiap langkah."
      />
      <OpeningCatalog initial={items} initialTotal={total} initialFilter={filter} />
    </Container>
  );
}
