import { Container } from "@/components/ui";

/**
 * Tampil seketika saat pindah halaman, selama data halaman dimuat dari server.
 * Next.js juga mem-prefetch kerangka ini, sehingga klik menu langsung terasa responsif.
 */
export default function Loading() {
  return (
    <Container className="py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>
      <div className="animate-pulse space-y-4" aria-hidden>
        <div className="h-9 w-2/3 max-w-sm rounded-lg bg-line" />
        <div className="h-4 w-full max-w-xl rounded bg-line/70" />
        <div className="grid gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="aspect-square w-full max-w-[560px] rounded-xl bg-line/70" />
          <div className="space-y-3">
            <div className="h-28 rounded-xl bg-line/70" />
            <div className="h-20 rounded-xl bg-line/60" />
            <div className="h-20 rounded-xl bg-line/50" />
          </div>
        </div>
      </div>
    </Container>
  );
}
