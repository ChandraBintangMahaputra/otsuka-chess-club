import { AdminList } from "@/components/admin/list";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatTanggal } from "@/lib/date";

export default async function AdminDokumentasiPage() {
  await requireAdmin();
  const rows = await sql`
    select id, title, category, held_on::text as held_on, is_published from activities order by held_on desc`;
  return (
    <AdminList
      title="Dokumentasi"
      base="/admin/dokumentasi"
      rows={rows.map((r) => ({
        id: r.id,
        title: r.title,
        meta: `${r.category} · ${formatTanggal(r.held_on)}`,
        published: r.is_published,
      }))}
    />
  );
}
