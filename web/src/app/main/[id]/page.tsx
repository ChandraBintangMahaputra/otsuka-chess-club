import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameAction } from "@/actions/play";
import { OnlineGame } from "@/components/play/online-game";
import { Container } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { RealtimeProvider } from "@/lib/realtime";
import { realtimeConfig } from "@/lib/realtime-config";

export const metadata: Metadata = { title: "Permainan" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GamePage({ params }: PageProps<"/main/[id]">) {
  const { id } = await params;
  await requireUser(`/main/${id}`);
  if (!UUID.test(id)) notFound();
  const r = await getGameAction(id);
  if (!r.ok) notFound();

  return (
    <Container className="py-6 pb-12">
      <h1 className="sr-only">
        {r.game.white.fullName} melawan {r.game.black.fullName}
      </h1>
      <RealtimeProvider config={realtimeConfig()}>
        <OnlineGame initial={r.game} />
      </RealtimeProvider>
    </Container>
  );
}
