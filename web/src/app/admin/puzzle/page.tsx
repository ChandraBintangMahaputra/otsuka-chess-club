import Link from "next/link";
import { importPuzzlesAction, setDailyPuzzleAction } from "@/actions/admin";
import { AdminForm } from "@/components/admin/forms";
import { Badge, buttonClass, Button, Card, Field, Input, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayWib } from "@/lib/date";
import { PUZZLE_THEMES } from "@/lib/types";

export default async function AdminPuzzlePage({ searchParams }: PageProps<"/admin/puzzle">) {
  await requireAdmin();
  const { theme, rating } = await searchParams;
  const themeValue = typeof theme === "string" ? theme : "";
  const ratingValue = typeof rating === "string" && /^\d+$/.test(rating) ? Number(rating) : null;

  const rows = await sql`
    select id, rating, themes, source, is_published from puzzles
    where true
      ${themeValue ? sql`and themes @> ${[themeValue]}::text[]` : sql``}
      ${ratingValue ? sql`and rating between ${ratingValue - 100} and ${ratingValue + 100}` : sql``}
    order by created_at desc limit 50`;
  const [{ total }] = await sql`select count(*)::int as total from puzzles`;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">Puzzle</h1>
        <Link href="/admin/puzzle/baru" className={buttonClass("primary", "sm")}>
          Tambah
        </Link>
      </div>
      <p className="mt-1 text-muted">{total.toLocaleString("id-ID")} puzzle di database.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-xl">Puzzle harian</h2>
          <AdminForm action={setDailyPuzzleAction} submit="Atur">
            <Field label="Tanggal" name="date">
              <Input id="date" name="date" type="date" required defaultValue={todayWib()} />
            </Field>
            <Field label="ID puzzle" name="puzzle_id">
              <Input id="puzzle_id" placeholder="Tempel ID puzzle dari halaman detail" name="puzzle_id" required />
            </Field>
          </AdminForm>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-xl">Impor CSV Lichess</h2>
          <AdminForm action={importPuzzlesAction} submit="Impor">
            <Field label="File CSV" name="file" help="Format asli Lichess, maksimal 4 MB. Puzzle yang sudah ada dilewati.">
              <Input id="file" name="file" type="file" accept=".csv" required />
            </Field>
          </AdminForm>
        </Card>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Field label="Tema" name="theme">
            <Select id="theme" name="theme" defaultValue={themeValue}>
              <option value="">Semua</option>
              {PUZZLE_THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="w-32">
          <Field label="Rating ±100" name="rating">
            <Input id="rating" placeholder="Mis. 1200" name="rating" type="number" defaultValue={ratingValue ?? ""} />
          </Field>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/puzzle/${r.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-paper">
              <span className="min-w-0">
                <span className="block font-semibold">Rating {r.rating}</span>
                <span className="block truncate text-sm text-muted">{r.themes.join(", ")}</span>
              </span>
              <span className="flex shrink-0 gap-1">
                <Badge>{r.source}</Badge>
                {!r.is_published && <Badge tone="copper">Draf</Badge>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
