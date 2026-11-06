import { notFound } from "next/navigation";
import { saveActivityAction } from "@/actions/admin";
import { AdminForm, DeleteButton, PgnField } from "@/components/admin/forms";
import { PhotoManager } from "@/components/admin/image-fields";
import { PublishedField } from "@/components/admin/list";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CATEGORY_LABEL } from "@/lib/types";

export default async function EditDokumentasiPage({ params }: PageProps<"/admin/dokumentasi/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "baru";
  const row = isNew
    ? null
    : (await sql`select *, held_on::text as held_text from activities where id::text = ${id}`)[0];
  if (!isNew && !row) notFound();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">{isNew ? "Tambah dokumentasi" : "Ubah dokumentasi"}</h1>
        {row && <DeleteButton kind="activity" id={row.id} />}
      </div>
      <div className="max-w-3xl">
        <AdminForm action={saveActivityAction}>
          {row && <input type="hidden" name="id" value={row.id} />}
          <Field label="Judul" name="title">
            <Input id="title" placeholder="Mis. Turnamen Internal 2026" name="title" required defaultValue={row?.title} />
          </Field>
          <Field label="Slug" name="slug">
            <Input id="slug" placeholder="Mis. turnamen-internal-2026" name="slug" required defaultValue={row?.slug} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kategori" name="category">
              <Select id="category" name="category" defaultValue={row?.category ?? "turnamen"}>
                {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tanggal" name="held_on">
              <Input id="held_on" name="held_on" type="date" required defaultValue={row?.held_text} />
            </Field>
            <Field label="Lokasi" name="location">
              <Input id="location" placeholder="Mis. Ruang Serbaguna Lt. 3" name="location" defaultValue={row?.location} />
            </Field>
          </div>
          <Field label="Deskripsi (Markdown)" name="description_md">
            <Textarea id="description_md" placeholder="Ceritakan jalannya kegiatan" name="description_md" rows={8} defaultValue={row?.description_md} />
          </Field>
          <PhotoManager defaultPhotos={row?.photo_paths} defaultCover={row?.cover_path} />
          <Field label="Peringkat (JSON, opsional)" name="standings" help='Contoh: [{"name":"Budi","points":4.5}]'>
            <Textarea
              id="standings" placeholder={"[{\"name\": \"Budi\", \"points\": 4.5}]"}
              name="standings"
              rows={5}
              defaultValue={row?.standings ? JSON.stringify(row.standings, null, 2) : ""}
            />
          </Field>
          <PgnField label="PGN partai final (opsional)" defaultValue={row?.pgn ?? ""} />
          <PublishedField checked={row?.is_published ?? false} />
        </AdminForm>
      </div>
    </>
  );
}
