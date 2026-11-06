import { notFound } from "next/navigation";
import { saveLandingItemAction } from "@/actions/admin-site";
import { DeleteLandingItem } from "@/components/admin/delete-landing-item";
import { AdminForm } from "@/components/admin/forms";
import { PublishedField } from "@/components/admin/list";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { LANDING_SECTIONS } from "@/lib/site-content";

export default async function EditLandingItemPage({
  params,
  searchParams,
}: PageProps<"/admin/beranda/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { section } = await searchParams;
  const isNew = id === "baru";
  const row = isNew ? null : (await sql`select * from landing_items where id::text = ${id}`)[0];
  if (!isNew && !row) notFound();

  const defaultSection = row?.section ?? (typeof section === "string" && section in LANDING_SECTIONS ? section : "kegiatan");

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">{isNew ? "Tambah item beranda" : "Ubah item beranda"}</h1>
        {row && <DeleteLandingItem id={row.id} />}
      </div>
      <div className="max-w-2xl">
        <AdminForm action={saveLandingItemAction}>
          {row && <input type="hidden" name="id" value={row.id} />}
          <Field label="Bagian" name="section">
            <Select id="section" name="section" defaultValue={defaultSection}>
              {Object.entries(LANDING_SECTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Judul atau pertanyaan" name="title">
            <Input id="title" placeholder="Mis. Apakah ada biaya?" name="title" required defaultValue={row?.title} />
          </Field>
          <Field label="Isi atau jawaban" name="body">
            <Textarea id="body" placeholder="Tulis isi atau jawaban" name="body" rows={4} defaultValue={row?.body} className="font-sans text-base" />
          </Field>
          <Field label="Tautan" name="href" help="Wajib untuk Mulai belajar, mis. /belajar. Bagian lain diabaikan.">
            <Input id="href" placeholder="Mis. /belajar" name="href" defaultValue={row?.href ?? ""} />
          </Field>
          <Field label="Urutan" name="position">
            <Input id="position" placeholder="Mis. 1" name="position" type="number" min={1} required defaultValue={row?.position ?? 1} />
          </Field>
          <PublishedField checked={row?.is_published ?? true} />
        </AdminForm>
      </div>
    </>
  );
}
