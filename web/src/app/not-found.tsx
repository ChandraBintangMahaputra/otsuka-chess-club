import Link from "next/link";
import { buttonClass, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="max-w-lg py-20 text-center">
      <p className="font-display text-6xl font-semibold text-forest">404</p>
      <h1 className="mt-3 text-2xl">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-muted">Sepertinya langkah ini tidak ada di papan.</p>
      <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
        Kembali ke beranda
      </Link>
    </Container>
  );
}
