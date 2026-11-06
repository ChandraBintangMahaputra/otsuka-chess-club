"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { StaticBoard } from "@/components/chess/static-board";
import { Badge, Button, Field, Input, Select } from "@/components/ui";
import type { OpeningCard } from "@/lib/types";

export type CatalogFilter = { q: string; side: string; level: string; first: string; notes: string };

function toQuery(filter: CatalogFilter, page?: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) params.set(key, value);
  if (page) params.set("page", String(page));
  return params.toString();
}

export function OpeningCatalog({
  initial,
  initialTotal,
  initialFilter,
}: {
  initial: OpeningCard[];
  initialTotal: number;
  initialFilter: CatalogFilter;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const [items, setItems] = useState(initial);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const first = useRef(true);

  async function load(nextFilter: CatalogFilter, nextPage: number) {
    const id = ++request.current;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/openings?${toQuery(nextFilter, nextPage)}`);
      if (!res.ok) throw new Error();
      const data: { items: OpeningCard[]; total: number } = await res.json();
      if (id !== request.current) return;
      setItems((old) => (nextPage === 1 ? data.items : [...old, ...data.items]));
      setTotal(data.total);
      setPage(nextPage);
    } catch {
      if (id === request.current) setFailed(true);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const query = toQuery(filter);
    window.history.replaceState(null, "", query ? `/opening?${query}` : "/opening");
    const timer = setTimeout(() => load(filter, 1), 300);
    return () => clearTimeout(timer);
  }, [filter]);

  const set = (key: keyof CatalogFilter) => (e: { target: { value: string } }) =>
    setFilter((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Cari" name="cari">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3.5 text-muted" aria-hidden />
            <Input
              id="cari"
              type="search"
              value={filter.q}
              onChange={set("q")}
              placeholder="Nama atau ECO"
              className="pl-9"
            />
          </div>
        </Field>
        <Field label="Warna" name="warna">
          <Select id="warna" value={filter.side} onChange={set("side")}>
            <option value="">Semua</option>
            <option value="white">Putih</option>
            <option value="black">Hitam</option>
          </Select>
        </Field>
        <Field label="Level" name="level">
          <Select id="level" value={filter.level} onChange={set("level")}>
            <option value="">Semua</option>
            <option value="pemula">Pemula</option>
            <option value="menengah">Menengah</option>
          </Select>
        </Field>
        <Field label="Langkah pertama" name="langkah">
          <Select id="langkah" value={filter.first} onChange={set("first")}>
            <option value="">Semua</option>
            <option value="1.e4">1.e4</option>
            <option value="1.d4">1.d4</option>
            <option value="lain">Lainnya</option>
          </Select>
        </Field>
        <Field label="Penjelasan" name="penjelasan">
          <Select id="penjelasan" value={filter.notes} onChange={set("notes")}>
            <option value="">Semua</option>
            <option value="ada">Hanya yang lengkap</option>
          </Select>
        </Field>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-muted">
        {total.toLocaleString("id-ID")} opening{loading ? ", memuat…" : ""}
      </p>
      {failed && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          Gagal memuat opening. Coba lagi.
        </p>
      )}

      <ul className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((o) => (
          <li key={o.id}>
            <Link
              href={`/opening/${o.slug}`}
              className="flex h-full gap-4 rounded-xl border border-line bg-surface p-3 transition-colors duration-150 hover:border-forest"
            >
              <div className="w-28 shrink-0">
                <StaticBoard
                  fen={o.final_fen}
                  coordinates={false}
                  flipped={o.side === "black"}
                  label={`Posisi akhir ${o.name}`}
                />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-tight">{o.name}</span>
                <span className="mt-1 block text-sm text-muted">
                  {o.eco} · {o.first_move}
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  <Badge tone={o.side === "white" ? "neutral" : "forest"}>
                    {o.side === "white" ? "Putih" : "Hitam"}
                  </Badge>
                  {o.is_curated && <Badge tone="copper">{o.level === "pemula" ? "Pemula" : "Menengah"}</Badge>}
                  {o.is_curated && <Badge tone="success">Lengkap</Badge>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && (
        <p className="mt-4 rounded-xl border border-line bg-surface p-6 text-muted">
          Tidak ada opening yang cocok. Coba ubah filter.
        </p>
      )}

      {items.length < total && (
        <div className="mt-6 text-center">
          <Button variant="secondary" disabled={loading} onClick={() => load(filter, page + 1)}>
            {loading ? "Memuat…" : "Muat lebih banyak"}
          </Button>
        </div>
      )}
    </div>
  );
}
