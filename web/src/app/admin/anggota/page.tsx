import { MemberActions } from "@/components/admin/forms";
import { Badge, Button, Input } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function AnggotaPage({ searchParams }: PageProps<"/admin/anggota">) {
  const admin = await requireAdmin();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const like = `%${query}%`;

  const users = await sql`
    select id, full_name, username, email, division, role, is_active, last_login_at
    from users
    where ${query ? sql`full_name ilike ${like} or username ilike ${like} or email ilike ${like}` : sql`true`}
    order by created_at desc limit 100`;

  return (
    <>
      <h1 className="text-3xl">Anggota</h1>
      <form className="mt-4 flex max-w-md gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Cari anggota
        </label>
        <Input id="q" name="q" type="search" defaultValue={query} placeholder="Nama, username, atau email" />
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {users.length === 0 && <li className="p-4 text-muted">Tidak ada anggota.</li>}
        {users.map((u) => {
          const isSelf = u.id === admin.id;
          return (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold">
                  {u.full_name} <span className="font-normal text-muted">@{u.username}</span>
                </p>
                <p className="text-sm text-muted">
                  {u.email} · {u.division}
                </p>
                <div className="mt-1 flex gap-1">
                  <Badge tone={u.role === "admin" ? "forest" : "neutral"}>{u.role === "admin" ? "Admin" : "Anggota"}</Badge>
                  {!u.is_active && <Badge tone="copper">Nonaktif</Badge>}
                </div>
              </div>
              {!isSelf && (
                <MemberActions userId={u.id} name={u.full_name} role={u.role} isActive={u.is_active} />
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
