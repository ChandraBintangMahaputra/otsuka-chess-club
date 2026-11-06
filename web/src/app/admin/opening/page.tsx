import { AdminList } from "@/components/admin/list";
import { Button, Input } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function AdminOpeningPage({ searchParams }: PageProps<"/admin/opening">) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const like = `%${query.replace(/[%_\\]/g, "\\$&").replace(/\s+/g, "%")}%`;

  const rows = await sql`
    select id, name, eco, side, level, is_published, is_curated, count(*) over()::int as total
    from openings
    where ${query ? sql`name ilike ${like} or eco ilike ${like}` : sql`true`}
    order by is_curated desc, char_length(pgn), name limit 50`;
  const total: number = rows[0]?.total ?? 0;

  return (
    <>
      <form className="mb-6 flex max-w-md gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Cari opening
        </label>
        <Input id="q" name="q" type="search" defaultValue={query} placeholder="Nama atau ECO" />
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>
      <AdminList
        title="Opening"
        base="/admin/opening"
        rows={rows.map((r) => ({
          id: r.id,
          title: r.name,
          meta: `${r.eco} · ${r.side === "white" ? "Putih" : "Hitam"} · ${r.is_curated ? "lengkap" : "tanpa penjelasan"}`,
          published: r.is_published,
        }))}
      />
      <p className="mt-3 text-sm text-muted">
        Menampilkan {rows.length} dari {total.toLocaleString("id-ID")} opening. Gunakan pencarian untuk yang lain.
      </p>
    </>
  );
}
