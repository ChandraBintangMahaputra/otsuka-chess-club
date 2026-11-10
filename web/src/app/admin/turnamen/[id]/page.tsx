import { notFound } from "next/navigation";
import { TournamentEditor } from "@/components/tournament/tournament-editor";
import { getTournamentById } from "@/lib/tournament-queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditTurnamenPage({ params }: PageProps<"/admin/turnamen/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const t = await getTournamentById(id);
  if (!t) notFound();
  return <TournamentEditor initial={t} />;
}
