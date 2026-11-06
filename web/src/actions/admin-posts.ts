"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AdminState } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { POST_TYPES, postSchema, type PostType } from "@/lib/post";

function refresh(type: PostType) {
  const { path } = POST_TYPES[type];
  revalidatePath(path);
  revalidatePath(`${path}/[slug]`, "page");
  revalidatePath("/");
}

export async function savePostAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = postSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const d = parsed.data;
  const published = form.get("is_published") === "on";
  const rawId = form.get("id");
  const id = typeof rawId === "string" && rawId ? z.string().uuid().parse(rawId) : null;

  try {
    if (id) {
      await sql`
        update posts set slug = ${d.slug}, title = ${d.title}, excerpt = ${d.excerpt}, body_md = ${d.body_md},
          cover_path = ${d.cover_path}, published_on = ${d.published_on}, is_published = ${published},
          updated_at = now()
        where id = ${id} and type = ${d.type}`;
    } else {
      await sql`
        insert into posts (type, slug, title, excerpt, body_md, cover_path, published_on, is_published)
        values (${d.type}, ${d.slug}, ${d.title}, ${d.excerpt}, ${d.body_md}, ${d.cover_path},
                ${d.published_on}, ${published})`;
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { error: "Slug sudah dipakai" };
    console.error(e);
    return { error: "Gagal menyimpan. Coba lagi." };
  }

  refresh(d.type);
  const { label, admin } = POST_TYPES[d.type];
  return { success: `${label} tersimpan.`, redirectTo: admin };
}

export async function deletePostAction(type: PostType, id: string) {
  await requireAdmin();
  const target = z.string().uuid().parse(id);
  const kind = z.enum(["kegiatan", "artikel"]).parse(type);
  await sql`delete from posts where id = ${target} and type = ${kind}`;
  refresh(kind);
}
