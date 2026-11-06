import { notFound } from "next/navigation";
import { saveLessonAction } from "@/actions/admin";
import { AdminForm, DeleteButton } from "@/components/admin/forms";
import { PublishedField } from "@/components/admin/list";
import { Field, Input, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function EditMateriPage({ params }: PageProps<"/admin/materi/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "baru";
  const row = isNew ? null : (await sql`select * from lessons where id::text = ${id}`)[0];
  if (!isNew && !row) notFound();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">{isNew ? "Tambah materi" : "Ubah materi"}</h1>
        {row && <DeleteButton kind="lesson" id={row.id} />}
      </div>
      <div className="max-w-3xl">
        <AdminForm action={saveLessonAction}>
          {row && <input type="hidden" name="id" value={row.id} />}
          <Field label="Judul" name="title">
            <Input id="title" placeholder="Mis. Skakmat dan pat" name="title" required defaultValue={row?.title} />
          </Field>
          <Field label="Slug" name="slug" help="Dipakai di URL, mis. skakmat-dan-pat.">
            <Input id="slug" placeholder="Mis. skakmat-dan-pat" name="slug" required defaultValue={row?.slug} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bab" name="chapter">
              <Input id="chapter" placeholder="Mis. 5" name="chapter" type="number" min={1} required defaultValue={row?.chapter ?? 1} />
            </Field>
            <Field label="Urutan" name="position">
              <Input id="position" placeholder="Mis. 2" name="position" type="number" min={1} required defaultValue={row?.position ?? 1} />
            </Field>
          </div>
          <Field label="Ringkasan" name="summary">
            <Input id="summary" placeholder="Satu kalimat tentang isi materi" name="summary" defaultValue={row?.summary} />
          </Field>
          <Field
            label="Isi Markdown"
            name="content_md"
            help='Papan: ::board{fen="..." arrows="e2e4" highlight="e4" caption="..."} di baris tersendiri.'
          >
            <Textarea id="content_md" placeholder={"Tulis materi dalam Markdown. Papan: ::board{fen=\"...\" arrows=\"e2e4\"}"} name="content_md" rows={16} defaultValue={row?.content_md} />
          </Field>
          <Field
            label="Latihan (JSON)"
            name="exercises"
            help='Array berisi {"fen","prompt","answers":["Qh7#"],"explanation","hint"}. Jawaban dicek legal saat disimpan.'
          >
            <Textarea
              id="exercises" placeholder={"[{\"fen\": \"...\", \"prompt\": \"Beri skakmat\", \"answers\": [\"Ra8#\"], \"explanation\": \"...\"}]"}
              name="exercises"
              rows={12}
              defaultValue={JSON.stringify(row?.exercises ?? [], null, 2)}
            />
          </Field>
          <PublishedField checked={row?.is_published ?? false} />
        </AdminForm>
      </div>
    </>
  );
}
