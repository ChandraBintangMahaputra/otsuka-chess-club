import type { Metadata } from "next";
import { PostIndex } from "@/components/learn/post-views";
import { listPosts } from "@/lib/post-queries";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Kegiatan", description: "Kegiatan klub Otsuka Chess." };

export default async function KegiatanPage() {
  return <PostIndex title="Kegiatan" description="Agenda dan cerita kegiatan klub." posts={await listPosts("kegiatan")} />;
}
