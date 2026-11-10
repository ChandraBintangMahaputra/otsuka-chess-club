"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Dices, ShieldCheck } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { verifyDraw, type DrawCheck, type DrawRecord } from "@/lib/draw";
import type { KnockoutSection } from "@/lib/tournament";

const time = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Jakarta" }) + " WIB";

/**
 * Bukti undian: kode acak dari server, waktu, pengundi, dan pemeriksaan ulang
 * yang dijalankan di browser pengunjung sendiri.
 */
export function DrawPanel({ draws, section, admin }: { draws: DrawRecord[]; section: KnockoutSection; admin?: boolean }) {
  const [check, setCheck] = useState<DrawCheck | null>(null);
  const latest = draws[draws.length - 1];

  if (!latest) {
    return admin ? (
      <p className="text-sm text-muted">Bagian ini belum pernah diundi oleh sistem.</p>
    ) : null;
  }

  return (
    <div className="rounded-xl border-2 border-ink bg-surface">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <ShieldCheck size={28} className="mt-0.5 shrink-0 text-success" aria-hidden />
          <div className="min-w-0">
            <p className="font-bold">Pertemuan diundi acak oleh sistem</p>
            <p className="text-sm text-muted">
              {time(latest.createdAt)} · ditekan oleh {latest.createdBy}
              {draws.length > 1 && <> · undian ke-{draws.length}</>}
            </p>
            <p className="mt-1 break-all font-mono text-xs">
              Kode undian: <span className="font-bold">{latest.seed}</span>
            </p>
          </div>
        </div>
        <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setCheck(verifyDraw(latest, section))}>
          <Dices size={16} aria-hidden /> Periksa ulang di perangkat ini
        </Button>
      </div>

      {check && (
        <ul aria-live="polite" className="space-y-1.5 border-t border-line px-4 py-3 text-sm">
          <CheckRow ok={check.reproducible}>
            {check.reproducible
              ? `Dihitung ulang di browser kamu: kode ${latest.seed.slice(0, 8)}… menghasilkan urutan yang persis sama.`
              : "Hasil tercatat tidak cocok dengan kode undiannya."}
          </CheckRow>
          <CheckRow ok={check.matchesBracket}>
            {check.matchesBracket
              ? "Posisi pemain di bagan sama persis dengan hasil undian, tidak ada yang dipindah manual."
              : "Posisi pemain di bagan berbeda dari hasil undian terakhir (ada perubahan manual setelah undian)."}
          </CheckRow>
        </ul>
      )}

      <details className="border-t border-line">
        <summary className="min-h-11 px-4 py-3 text-sm font-semibold">
          Cara kerja undian dan riwayat ({draws.length} kali)
        </summary>
        <div className="space-y-4 px-4 pb-4 text-sm">
          <ol className="list-decimal space-y-1 pl-5 text-muted">
            <li>Admin hanya menekan tombol. Kode undian 128-bit dibuat server dengan generator acak kriptografis, jadi tidak bisa dipilih.</li>
            <li>Nama peserta diurutkan abjad dulu, sehingga urutan ketik admin tidak berpengaruh.</li>
            <li>Daftar itu diacak (Fisher–Yates) memakai angka acak yang diturunkan dari kode undian, lalu diisikan ke posisi bagan dari atas ke bawah.</li>
            <li>Kode dan hasil langsung tercatat permanen. Setiap undian ulang ikut tampil di bawah, tidak bisa dihapus.</li>
          </ol>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {[...draws].reverse().map((d, i) => (
              <li key={d.id} className="p-3">
                <p className="font-semibold">
                  Undian ke-{draws.length - i}
                  {i === 0 && <span className="ml-2 rounded bg-success-soft px-1.5 py-0.5 text-xs text-success">dipakai</span>}
                </p>
                <p className="text-muted">
                  {time(d.createdAt)} · {d.createdBy}
                </p>
                <p className="break-all font-mono text-xs">{d.seed}</p>
                <details className="mt-1">
                  <summary className="text-xs font-semibold text-forest">Lihat urutan hasil</summary>
                  <ol className="mt-1 list-decimal columns-2 gap-6 pl-5 text-xs sm:columns-3">
                    {d.result.map((n, j) => (
                      <li key={j}>{n}</li>
                    ))}
                  </ol>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}

function CheckRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  return (
    <li className={cn("flex gap-2", ok ? "text-success" : "text-copper")}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
