import type { Metadata } from "next";
import { getLobbyAction } from "@/actions/play";
import { Lobby } from "@/components/play/lobby";
import { Container, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { RealtimeProvider } from "@/lib/realtime";
import { realtimeConfig } from "@/lib/realtime-config";

export const metadata: Metadata = { title: "Main", description: "Tantang rekan kantor bermain catur online." };

export default async function MainPage() {
  await requireUser("/main");
  const initial = await getLobbyAction();
  return (
    <Container className="pb-12">
      <PageHeader title="Main online" description="Lihat siapa yang sedang online, lalu tantang mereka. Hasilnya masuk peringkat kantor." />
      <RealtimeProvider config={realtimeConfig()}>
        <Lobby initial={initial} />
      </RealtimeProvider>
    </Container>
  );
}
