import { notFound } from "next/navigation";
import { savePuzzleAction } from "@/actions/admin";
import { AdminForm, DeleteButton, FenField } from "@/components/admin/forms";
import { PublishedField } from "@/components/admin/list";
import { Field, Input } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function EditPuzzlePage({ params }: PageProps<"/admin/puzzle/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "baru";
  const row = isNew ? null : (await sql`select * from puzzles where id::text = ${id}`)[0];
  if (!isNew && !row) notFound();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl">{isNew ? "Tambah puzzle" : "Ubah puzzle"}</h1>
        {row && <DeleteButton kind="puzzle" id={row.id} />}
      </div>
      <div className="max-w-3xl">
        <AdminForm action={savePuzzleAction}>
          {row && <input type="hidden" name="id" value={row.id} />}
          <FenField defaultValue={row?.fen} />
          <Field label="Langkah (UCI)" name="moves" help="Dipisah spasi. Langkah pertama adalah langkah lawan.">
            <Input id="moves" placeholder="Mis. e2e4 e7e5 g1f3" name="moves" required defaultValue={row?.moves} />
          </Field>
          <Field label="Rating" name="rating">
            <Input id="rating" placeholder="Mis. 1200" name="rating" type="number" required defaultValue={row?.rating ?? 1200} />
          </Field>
          <Field label="Tema" name="themes" help="Dipisah spasi, mis. fork mateIn2">
            <Input id="themes" placeholder="Mis. fork mateIn2" name="themes" defaultValue={row?.themes?.join(" ")} />
          </Field>
          <PublishedField checked={row?.is_published ?? true} />
        </AdminForm>
      </div>
    </>
  );
}
