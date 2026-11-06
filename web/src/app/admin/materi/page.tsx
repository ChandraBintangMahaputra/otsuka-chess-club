import { AdminList } from "@/components/admin/list";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function AdminMateriPage() {
  await requireAdmin();
  const rows = await sql`select id, title, chapter, position, is_published from lessons order by chapter, position`;
  return (
    <AdminList
      title="Materi"
      base="/admin/materi"
      rows={rows.map((r) => ({
        id: r.id,
        title: r.title,
        meta: `Bab ${r.chapter}, urutan ${r.position}`,
        published: r.is_published,
      }))}
    />
  );
}
