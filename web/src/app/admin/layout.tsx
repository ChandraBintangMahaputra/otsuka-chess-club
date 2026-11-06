import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const LINKS = [
  ["/admin", "Dasbor"],
  ["/admin/beranda", "Beranda"],
  ["/admin/kegiatan", "Kegiatan"],
  ["/admin/artikel", "Artikel"],
  ["/admin/dokumentasi", "Dokumentasi"],
  ["/admin/anggota", "Anggota"],
  ["/admin/materi", "Materi"],
  ["/admin/opening", "Opening"],
  ["/admin/puzzle", "Puzzle"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <Container className="pb-12 pt-6">
      <nav aria-label="Menu admin" className="flex gap-1 overflow-x-auto border-b border-line pb-3">
        {LINKS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold hover:bg-line/50"
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="pt-6">{children}</div>
    </Container>
  );
}
