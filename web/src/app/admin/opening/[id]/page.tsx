import { notFound } from "next/navigation";
import { saveOpeningAction } from "@/actions/admin";
import { AdminForm, DeleteButton, PgnField } from "@/components/admin/forms";
import { PublishedField } from "@/components/admin/list";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function EditOpeningPage({ params }: PageProps<"/admin/opening/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "baru";
  const row = isNew ? null : (await sql`select * from openings where id::text = ${id}`)[0];
  if (!isNew && !row) notFound();
  const others = await sql`select id, name from openings where is_curated and id::text <> ${id} order by name`;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">{isNew ? "Tambah opening" : "Ubah opening"}</h1>
        {row && <DeleteButton kind="opening" id={row.id} />}
      </div>
      <div className="max-w-3xl">
        <AdminForm action={saveOpeningAction}>
          {row && <input type="hidden" name="id" value={row.id} />}
          <Field label="Nama" name="name">
            <Input id="name" placeholder="Mis. Italian Game" name="name" required defaultValue={row?.name} />
          </Field>
          <Field label="Slug" name="slug">
            <Input id="slug" placeholder="Mis. italian-game" name="slug" required defaultValue={row?.slug} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="ECO" name="eco">
              <Input id="eco" placeholder="Mis. C50" name="eco" required defaultValue={row?.eco} />
            </Field>
            <Field label="Warna" name="side">
              <Select id="side" name="side" defaultValue={row?.side ?? "white"}>
                <option value="white">Putih</option>
                <option value="black">Hitam</option>
              </Select>
            </Field>
            <Field label="Level" name="level">
              <Select id="level" name="level" defaultValue={row?.level ?? "pemula"}>
                <option value="pemula">Pemula</option>
                <option value="menengah">Menengah</option>
              </Select>
            </Field>
          </div>
          <Field label="Induk variasi" name="parent_id">
            <Select id="parent_id" name="parent_id" defaultValue={row?.parent_id ?? ""}>
              <option value="">Tidak ada</option>
              {others.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <PgnField defaultValue={row?.pgn} required />
          <Field label="Catatan per langkah (JSON)" name="move_notes" help='Kunci = nomor langkah setengah, mis. {"1":"Menguasai pusat."}'>
            <Textarea
              id="move_notes" placeholder={"{\"1\": \"Menguasai pusat.\", \"2\": \"Hitam menjawab simetris.\"}"}
              name="move_notes"
              rows={10}
              defaultValue={JSON.stringify(row?.move_notes ?? {}, null, 2)}
            />
          </Field>
          <Field label="Ide, rencana, dan jebakan (Markdown)" name="ideas_md">
            <Textarea id="ideas_md" placeholder="### Ide utama\nTulis ide, rencana, dan jebakan umum" name="ideas_md" rows={10} defaultValue={row?.ideas_md} />
          </Field>
          <PublishedField checked={row?.is_published ?? false} />
        </AdminForm>
      </div>
    </>
  );
}
