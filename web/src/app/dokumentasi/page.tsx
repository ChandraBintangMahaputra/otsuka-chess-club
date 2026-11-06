import type { Metadata } from "next";
import { ActivityList } from "@/components/learn/activity-list";
import { Container, PageHeader } from "@/components/ui";
import { listActivities } from "@/lib/queries";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Dokumentasi",
  description: "Arsip turnamen, sesi latihan, dan gathering klub Otsuka Chess.",
};

export default async function DokumentasiPage() {
  const activities = await listActivities();
  return (
    <Container className="pb-12">
      <PageHeader title="Dokumentasi kegiatan" description="Turnamen, sesi latihan, dan gathering klub." />
      <ActivityList activities={activities} />
    </Container>
  );
}
