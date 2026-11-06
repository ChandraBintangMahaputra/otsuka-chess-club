import "server-only";
import { sql } from "./db";
import type { Post, PostType } from "./post";

export async function listPosts(type: PostType, limit = 200) {
  const rows = await sql`
    select id, type, slug, title, excerpt, body_md, cover_path, published_on::text as published_on
    from posts where type = ${type} and is_published
    order by published_on desc, title limit ${limit}`;
  return rows as unknown as Post[];
}

export async function getPost(type: PostType, slug: string) {
  const rows = await sql`
    select id, type, slug, title, excerpt, body_md, cover_path, published_on::text as published_on
    from posts where type = ${type} and slug = ${slug} and is_published`;
  return (rows[0] as unknown as Post) ?? null;
}
