import type { Metadata } from "next";
import Link from "next/link";
import { Medal } from "lucide-react";
import { buttonClass, Container, PageHeader } from "@/components/ui";
import { sql } from "@/lib/db";

export const revalidate = 60;
export const metadata: Metadata = { title: "Peringkat", description: "Peringkat catur online karyawan." };

export default async function PeringkatPage() {
  const rows = await sql`
    select u.id, u.full_name, u.username, u.division, u.play_rating,
      count(*)::int as games,
      count(*) filter (where (g.white_id = u.id and g.result = '1-0') or (g.black_id = u.id and g.result = '0-1'))::int as wins,
      count(*) filter (where g.result = '1/2-1/2')::int as draws
    from users u
    join games g on g.status = 'finished' and (g.white_id = u.id or g.black_id = u.id)
    where u.is_active
    group by u.id
    order by u.play_rating desc, games desc
    limit 100`;

  return (
    <Container className="max-w-4xl pb-12">
      <PageHeader title="Peringkat kantor" description="Rating Elo dari permainan online. Semua mulai dari 1200." />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-muted">Belum ada permainan yang selesai. Jadilah yang pertama di peringkat.</p>
          <Link href="/main" className={buttonClass("primary", "md", "mt-4")}>
            Main sekarang
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[32rem] text-left">
            <thead className="bg-paper text-sm text-muted">
              <tr>
                <th className="p-3 font-semibold">#</th>
                <th className="p-3 font-semibold">Pemain</th>
                <th className="p-3 text-right font-semibold">Rating</th>
                <th className="p-3 text-right font-semibold">Main</th>
                <th className="p-3 text-right font-semibold">M / S / K</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="p-3">
                    {i < 3 ? (
                      <Medal size={20} className={["text-[#b8860b]", "text-[#8a9097]", "text-[#a0522d]"][i]} aria-label={`Peringkat ${i + 1}`} />
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td className="p-3">
                    <span className="block font-semibold">{r.full_name}</span>
                    <span className="block text-sm text-muted">{r.division || `@${r.username}`}</span>
                  </td>
                  <td className="p-3 text-right font-display text-lg font-semibold tabular-nums">{r.play_rating}</td>
                  <td className="p-3 text-right tabular-nums">{r.games}</td>
                  <td className="p-3 text-right tabular-nums">
                    {r.wins} / {r.draws} / {r.games - r.wins - r.draws}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
