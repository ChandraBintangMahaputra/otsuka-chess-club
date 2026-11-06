import type { LandingSection, SiteSettings } from "@/lib/site-content";

/**
 * Isi awal beranda. Hanya dipakai `npm run db:landing` untuk mengisi master,
 * dan sebagai cadangan bila database tidak terjangkau. Ubah isi lewat /admin/beranda.
 */
export const defaultSettings: SiteSettings = {
  hero: {
    eyebrow: "Klub catur karyawan",
    title: "Belajar catur dari nol, bareng rekan sekantor.",
    tagline:
      "Materi dasar, latihan opening, dan ribuan puzzle taktik dalam satu tempat. Tidak perlu bisa main sebelumnya.",
    boardFen: "1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17",
    boardHighlight: "d8 e8",
    boardCaption: "Skakmat klasik Morphy, Paris 1858. Polanya kamu pelajari di Bab 8.",
  },
  about: {
    eyebrow: "Siapa kami",
    title: "Tentang klub",
    body: "Otsuka Chess adalah klub catur hobi internal perusahaan. Kami berkumpul untuk belajar, berlatih, dan bertanding santai, terbuka untuk semua karyawan dari yang belum tahu cara gerak Kuda sampai yang rutin ikut turnamen.",
    vision: "Menjadikan catur sebagai ruang belajar dan kebersamaan lintas divisi.",
    memberCount: null,
  },
  sections: {
    kegiatan: { eyebrow: "Agenda", title: "Kegiatan" },
    artikel: { eyebrow: "Bacaan", title: "Artikel terbaru" },
    dokumentasi: { eyebrow: "Arsip", title: "Dokumentasi terbaru" },
    belajar: { eyebrow: "Mulai dari mana saja", title: "Mulai belajar" },
    puzzle: {
      eyebrow: "Puzzle harian",
      title: "Bisa temukan langkah terbaiknya?",
      body: "Satu puzzle yang sama untuk semua orang hari ini.",
    },
    faq: { eyebrow: "Tanya jawab", title: "Pertanyaan umum" },
  },
  footer: {
    text: "Otsuka Chess, klub catur hobi internal karyawan.",
    contactLabel: "Kontak pengurus segera diumumkan",
    contactHref: null,
  },
};

export const defaultItems: { section: LandingSection; title: string; body: string; href?: string }[] = [
  {
    section: "belajar",
    title: "Belajar Dasar",
    body: "Dari mengenal papan sampai taktik dasar, dengan latihan di setiap materi.",
    href: "/belajar",
  },
  {
    section: "belajar",
    title: "Opening",
    body: "Ribuan pembukaan untuk ditelusuri, dan opening populer dijelaskan langkah demi langkah.",
    href: "/opening",
  },
  {
    section: "belajar",
    title: "Puzzle",
    body: "Puluhan ribu puzzle pilihan yang menyesuaikan kemampuanmu.",
    href: "/puzzle",
  },
  {
    section: "faq",
    title: "Saya belum bisa main sama sekali, boleh ikut?",
    body: "Sangat boleh. Modul Belajar Dasar dimulai dari mengenal papan, dan ada sesi khusus untuk pemula.",
  },
  {
    section: "faq",
    title: "Apakah harus punya akun untuk belajar?",
    body: "Tidak. Materi, opening, dan puzzle bisa dibuka tanpa login. Akun dibutuhkan agar progres dan rating puzzle tersimpan.",
  },
  {
    section: "faq",
    title: "Apakah ada biaya?",
    body: "Website ini gratis digunakan oleh seluruh karyawan.",
  },
  {
    section: "faq",
    title: "Saya sudah bisa main, apa yang bisa saya latih?",
    body: "Coba mode latihan opening dan puzzle sesuai rating. Tingkat kesulitan puzzle menyesuaikan kemampuanmu.",
  },
  {
    section: "faq",
    title: "Bagaimana cara bergabung ke kegiatan klub?",
    body: "Buat akun lewat tombol Gabung Klub, lalu hubungi pengurus lewat kontak di bagian bawah halaman.",
  },
];
