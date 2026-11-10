import Link from "next/link";
import { Badge } from "@/components/ui";
import { CreateTournamentButtons } from "@/components/tournament/tournament-editor";
import { listTournaments } from "@/lib/tournament-queries";

export default async function AdminTurnamenPage() {
  const rows = await listTournaments(false);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Turnamen</h1>
        <CreateTournamentButtons />
      </div>
      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {rows.length === 0 && <li className="p-4 text-muted">Belum ada turnamen.</li>}
        {rows.map((t) => (
          <li key={t.id}>
            <Link href={`/admin/turnamen/${t.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-paper">
              <span className="min-w-0">
                <span className="block font-semibold">{t.title}</span>
                <span className="block truncate text-sm text-muted">
                  /turnamen/{t.slug} · diubah {t.updatedAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </span>
              <Badge tone={t.isPublished ? "success" : "neutral"}>{t.isPublished ? "Terbit" : "Draf"}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
