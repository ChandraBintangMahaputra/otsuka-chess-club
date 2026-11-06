import type { Metadata } from "next";
import { PostIndex } from "@/components/learn/post-views";
import { listPosts } from "@/lib/post-queries";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Artikel", description: "Tulisan seputar catur dari klub Otsuka Chess." };

export default async function ArtikelPage() {
  return <PostIndex title="Artikel" description="Tulisan seputar catur dari anggota klub." posts={await listPosts("artikel")} />;
}
