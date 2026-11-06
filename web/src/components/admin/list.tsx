import Link from "next/link";
import { Badge, buttonClass } from "@/components/ui";

export type AdminRow = { id: string; title: string; meta: string; published: boolean };

export function AdminList({
  title,
  base,
  rows,
}: {
  title: string;
  base: string;
  rows: AdminRow[];
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">{title}</h1>
        <Link href={`${base}/baru`} className={buttonClass("primary", "sm")}>
          Tambah
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {rows.length === 0 && <li className="p-4 text-muted">Belum ada data.</li>}
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`${base}/${r.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-paper">
              <span className="min-w-0">
                <span className="block font-semibold">{r.title}</span>
                <span className="block text-sm text-muted">{r.meta}</span>
              </span>
              <Badge tone={r.published ? "success" : "neutral"}>{r.published ? "Terbit" : "Draf"}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function PublishedField({ checked }: { checked: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-2 font-semibold">
      <input type="checkbox" name="is_published" defaultChecked={checked} className="size-5 accent-[var(--forest)]" />
      Terbitkan
    </label>
  );
}
