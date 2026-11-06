import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function AdminPage() {
  await requireAdmin();
  const [c] = await sql`
    select (select count(*) from users)::int as anggota,
           (select count(*) from lessons)::int as materi,
           (select count(*) from openings)::int as opening,
           (select count(*) from puzzles)::int as puzzle,
           (select count(*) from activities)::int as kegiatan,
           (select count(*) from puzzle_attempts)::int as percobaan`;

  const stats: [string, number][] = [
    ["Anggota", c.anggota],
    ["Materi", c.materi],
    ["Opening", c.opening],
    ["Puzzle", c.puzzle],
    ["Kegiatan", c.kegiatan],
    ["Percobaan puzzle", c.percobaan],
  ];

  return (
    <>
      <h1 className="text-3xl">Dasbor admin</h1>
      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-4">
            <dd className="font-display text-3xl font-semibold">{value.toLocaleString("id-ID")}</dd>
            <dt className="text-sm text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </>
  );
}
