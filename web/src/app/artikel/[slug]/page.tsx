import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/learn/post-views";
import { getPost, listPosts } from "@/lib/post-queries";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPosts("artikel")).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/artikel/[slug]">): Promise<Metadata> {
  const post = await getPost("artikel", (await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function ArtikelDetailPage({ params }: PageProps<"/artikel/[slug]">) {
  const post = await getPost("artikel", (await params).slug);
  if (!post) notFound();
  return <PostArticle post={post} />;
}
