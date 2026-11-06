import { notFound } from "next/navigation";
import { savePostAction } from "@/actions/admin-posts";
import { AdminForm } from "@/components/admin/forms";
import { AdminList, PublishedField } from "@/components/admin/list";
import { BodyField, CoverField } from "@/components/admin/image-fields";
import { DeletePost } from "@/components/admin/delete-post";
import { Field, Input, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayWib, formatTanggal } from "@/lib/date";
import { POST_TYPES, type PostType } from "@/lib/post";

export async function PostAdminList({ type }: { type: PostType }) {
  await requireAdmin();
  const rows = await sql`
    select id, title, published_on::text as published_on, is_published
    from posts where type = ${type} order by published_on desc, title`;
  const { label, admin } = POST_TYPES[type];
  return (
    <AdminList
      title={label}
      base={admin}
      rows={rows.map((r) => ({
        id: r.id,
        title: r.title,
        meta: formatTanggal(r.published_on),
        published: r.is_published,
      }))}
    />
  );
}

export async function PostAdminForm({ type, id }: { type: PostType; id: string }) {
  await requireAdmin();
  const isNew = id === "baru";
  const row = isNew
    ? null
    : (await sql`select *, published_on::text as date_text from posts where id::text = ${id} and type = ${type}`)[0];
  if (!isNew && !row) notFound();
  const { label } = POST_TYPES[type];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">
          {isNew ? "Tambah" : "Ubah"} {label.toLowerCase()}
        </h1>
        {row && <DeletePost type={type} id={row.id} />}
      </div>
      <div className="max-w-3xl">
        <AdminForm action={savePostAction}>
          <input type="hidden" name="type" value={type} />
          {row && <input type="hidden" name="id" value={row.id} />}
          <Field label="Judul" name="title">
            <Input id="title" placeholder="Mis. Turnamen Internal Agustus 2026" name="title" required defaultValue={row?.title} />
          </Field>
          <Field label="Slug" name="slug" help="Dipakai di URL. Kosongkan untuk dibuat otomatis dari judul.">
            <Input id="slug" placeholder="Otomatis dari judul, mis. turnamen-internal-agustus" name="slug" defaultValue={row?.slug} />
          </Field>
          <Field label="Tanggal" name="published_on">
            <Input
              id="published_on"
              name="published_on"
              type="date"
              required
              defaultValue={row?.date_text ?? todayWib()}
            />
          </Field>
          <Field label="Ringkasan" name="excerpt" help="Tampil di kartu daftar.">
            <Textarea id="excerpt" placeholder="Satu atau dua kalimat yang tampil di kartu daftar" name="excerpt" rows={2} defaultValue={row?.excerpt} className="font-sans text-base" />
          </Field>
          <CoverField defaultValue={row?.cover_path} />
          <BodyField defaultValue={row?.body_md} />
          <PublishedField checked={row?.is_published ?? false} />
        </AdminForm>
      </div>
    </>
  );
}
