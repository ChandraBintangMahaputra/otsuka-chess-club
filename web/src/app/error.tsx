"use client";

import { Button, Container } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="max-w-lg py-20 text-center">
      <h1 className="text-2xl">Terjadi kesalahan</h1>
      <p className="mt-2 text-muted">Halaman gagal dimuat. Coba lagi sebentar lagi.</p>
      <Button className="mt-6" onClick={reset}>
        Coba lagi
      </Button>
    </Container>
  );
}
