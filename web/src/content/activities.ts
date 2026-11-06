import type { Activity, Standing } from "@/lib/types";

export type ActivitySeed = {
  slug: string;
  title: string;
  category: Activity["category"];
  held_on: string;
  location: string;
  description_md: string;
  photos: number;
  standings?: Standing[];
  pgn?: string;
};

/**
 * DATA CONTOH. Kegiatan di bawah ini bukan kegiatan nyata. Foto adalah gambar
 * pengganti buatan scripts/gen-assets.mts. Ganti dengan data klub lewat /admin/dokumentasi.
 */
export const activities: ActivitySeed[] = [
  {
    slug: "contoh-turnamen-internal",
    title: "Contoh: Turnamen Internal",
    category: "turnamen",
    held_on: "2026-10-17",
    location: "Lokasi menyusul",
    description_md: `**Ini data contoh.** Ganti lewat panel admin dengan cerita turnamen sesungguhnya.

Halaman ini menunjukkan tampilan laporan turnamen: deskripsi, galeri foto, tabel peringkat, dan partai final yang bisa diputar langkah demi langkah. Partai di bawah adalah partai klasik Morphy lawan Duke Karl dan Count Isouard, Paris 1858.`,
    photos: 6,
    standings: [
      { name: "Peserta A", points: 4.5 },
      { name: "Peserta B", points: 4 },
      { name: "Peserta C", points: 3 },
      { name: "Peserta D", points: 2.5 },
    ],
    pgn: "1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#",
  },
  {
    slug: "contoh-sesi-latihan",
    title: "Contoh: Sesi Latihan Pemula",
    category: "latihan",
    held_on: "2026-09-24",
    location: "Lokasi menyusul",
    description_md: `**Ini data contoh.** Ganti lewat panel admin dengan catatan sesi latihan sesungguhnya.

Tuliskan materi yang dibahas, siapa yang memandu, dan apa yang akan dilanjutkan pada sesi berikutnya.`,
    photos: 4,
  },
  {
    slug: "contoh-gathering-klub",
    title: "Contoh: Gathering Klub",
    category: "gathering",
    held_on: "2026-08-29",
    location: "Lokasi menyusul",
    description_md: `**Ini data contoh.** Ganti lewat panel admin dengan cerita gathering sesungguhnya.

Halaman ini cocok untuk simultan, nobar turnamen, atau kumpul santai anggota klub.`,
    photos: 4,
  },
];

export const photoPaths = (a: ActivitySeed) =>
  Array.from({ length: a.photos }, (_, i) => `/dokumentasi/${a.slug}/${String(i + 1).padStart(2, "0")}.webp`);
