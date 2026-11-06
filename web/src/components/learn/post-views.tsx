import Image from "next/image";
import Link from "next/link";
import { LessonContent } from "@/components/learn/markdown";
import { Container, PageHeader } from "@/components/ui";
import { formatTanggal } from "@/lib/date";
import { POST_TYPES, type Post } from "@/lib/post";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`${POST_TYPES[post.type].path}/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-150 hover:border-forest"
    >
      {post.cover_path && (
        <div className="relative aspect-[16/9] bg-line">
          <Image
            src={post.cover_path}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <p className="text-sm text-muted">{formatTanggal(post.published_on)}</p>
        <h3 className="mt-1 text-lg group-hover:text-forest">{post.title}</h3>
        {post.excerpt && <p className="mt-1 line-clamp-3 text-muted">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <li key={p.id}>
          <PostCard post={p} />
        </li>
      ))}
    </ul>
  );
}

export function PostIndex({ title, description, posts }: { title: string; description: string; posts: Post[] }) {
  return (
    <Container className="pb-12">
      <PageHeader title={title} description={description} />
      {posts.length ? (
        <PostGrid posts={posts} />
      ) : (
        <p className="rounded-xl border border-line bg-surface p-6 text-muted">Belum ada tulisan.</p>
      )}
    </Container>
  );
}

export function PostArticle({ post }: { post: Post }) {
  const { label, path } = POST_TYPES[post.type];
  return (
    <Container className="max-w-3xl pb-12">
      <article>
        <header className="py-8">
          <Link href={path} className="text-sm font-semibold text-copper hover:underline">
            Semua {label.toLowerCase()}
          </Link>
          <h1 className="mt-1 text-3xl sm:text-4xl">{post.title}</h1>
          <p className="mt-2 text-sm text-muted">{formatTanggal(post.published_on)}</p>
        </header>
        {post.cover_path && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-line">
            <Image src={post.cover_path} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
          </div>
        )}
        <LessonContent markdown={post.body_md} />
      </article>
    </Container>
  );
}
