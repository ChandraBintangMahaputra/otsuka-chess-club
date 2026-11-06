import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/site/auth-forms";
import { Badge, Card, Container } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatTanggal } from "@/lib/date";
import { getProfileData } from "@/lib/queries";
import { CHAPTERS } from "@/lib/types";

export const metadata: Metadata = { title: "Profil" };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function ProfilPage() {
  const user = await requireUser();

  if (user.mustChangePassword) {
    return (
      <Container className="max-w-md py-10">
        <h1 className="text-3xl">Ganti password</h1>
        <p className="mt-1 text-muted">
          Akunmu memakai password sementara dari pengurus. Ganti dulu sebelum melanjutkan.
        </p>
        <Card className="mt-6 p-5">
          <ChangePasswordForm />
        </Card>
      </Container>
    );
  }

  const data = await getProfileData(user.id);
  const rate = data.stats.total ? Math.round((data.stats.solved / data.stats.total) * 100) : 0;

  return (
    <Container className="space-y-10 pb-12">
      <header className="pt-8">
        <h1 className="text-3xl sm:text-4xl">{user.fullName}</h1>
        <p className="mt-1 text-muted">
          @{user.username} · {user.division}
        </p>
      </header>

      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Rating puzzle" value={user.puzzleRating} />
        <Stat label="Puzzle dicoba" value={data.stats.total} />
        <Stat label="Tingkat berhasil" value={`${rate}%`} />
        <Stat label="Materi selesai" value={`${data.lessonsDone}/${data.lessonsTotal}`} />
      </section>

      <section>
        <h2 className="mb-3 text-2xl">Progres Belajar Dasar</h2>
        <ul className="space-y-3 rounded-xl border border-line bg-surface p-4">
          {data.chapters.map(([chapter, c]) => {
            const percent = Math.round((c.done / c.total) * 100);
            return (
              <li key={chapter}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium">
                    Bab {chapter}: {CHAPTERS[chapter]}
                  </span>
                  <span className="tabular-nums text-muted">{percent}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progres bab ${chapter}`}
                  className="mt-1 h-2 overflow-hidden rounded-full bg-line"
                >
                  <div className="h-full rounded-full bg-forest" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-2xl">Riwayat puzzle</h2>
          {data.attempts.length === 0 ? (
            <p className="rounded-xl border border-line bg-surface p-4 text-muted">
              Belum ada percobaan.{" "}
              <Link href="/puzzle" className="font-semibold text-forest underline">
                Coba puzzle harian
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {data.attempts.map((a) => {
                const delta = a.rating_after - a.rating_before;
                return (
                  <li key={a.puzzle_id}>
                    <Link href={`/puzzle/${a.puzzle_id}`} className="flex items-center gap-3 p-3 hover:bg-paper">
                      <Badge tone={a.solved ? "success" : "copper"}>{a.solved ? "Berhasil" : "Gagal"}</Badge>
                      <span className="min-w-0 flex-1 text-sm text-muted">
                        Rating {a.puzzle_rating} · {Math.round(a.time_ms / 1000)} detik
                        {a.used_hint ? " · petunjuk" : ""}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-2xl">Opening yang dilatih</h2>
          {data.openings.length === 0 ? (
            <p className="rounded-xl border border-line bg-surface p-4 text-muted">
              Belum ada latihan.{" "}
              <Link href="/opening" className="font-semibold text-forest underline">
                Pilih opening
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {data.openings.map((o) => (
                <li key={o.slug}>
                  <Link href={`/opening/${o.slug}`} className="flex items-center justify-between gap-3 p-3 hover:bg-paper">
                    <span className="font-medium">{o.name}</span>
                    <span className="text-right text-sm text-muted">
                      {o.attempts} kali · terbaik {o.best_streak}
                      <span className="block">{formatTanggal(new Date(o.last_practiced_at))}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="max-w-md">
        <h2 className="mb-3 text-2xl">Ganti password</h2>
        <Card className="p-5">
          <ChangePasswordForm />
        </Card>
      </section>
    </Container>
  );
}
