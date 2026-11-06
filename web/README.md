# Otsuka Chess

Website klub catur karyawan: landing page, Belajar Dasar, Opening, Puzzle, Dokumentasi, akun anggota, dan panel admin. Spesifikasi lengkap ada di `../FSD — Website Otsuka Chess.md`.

Stack: Next.js 16 (App Router), Tailwind CSS 4, `react-chessboard`, `chess.js`, Supabase Postgres.

## Menjalankan di lokal

1. Salin `.env.example` menjadi `.env.local`, lalu isi nilainya.
2. Jalankan:

   ```bash
   npm install
   npm run dev
   ```

Bila password database berisi tanda `$`, tulis sebagai `%24` di `.env.local`, karena Next.js memperlakukan `$` sebagai variabel.

Jaringan kantor memblokir port 6543 (transaction pooler). Untuk lokal, isi `DATABASE_URL` dengan session pooler port 5432.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm test` | Menguji logika puzzle, validasi, dan semua konten catur |
| `npm run db:schema` | Membuat tabel dari `supabase/schema.sql` (aman diulang) |
| `npm run db:seed` | Menulis materi, opening, dan kegiatan contoh dari `src/content/` |
| `npm run db:openings` | Mengimpor katalog opening Lichess dari `data/lichess-openings/` (CC0, aman diulang) |
| `npm run db:landing` | Mengisi master beranda sekali, tidak menimpa isi dari admin |
| `npm run db:posts` | Memindahkan kartu Kegiatan lama ke tabel `posts` (aman diulang) |
| `npm run make-admin -- <username>` | Menjadikan anggota sebagai admin |
| `npx tsx scripts/gen-assets.mts` | Membuat ulang gambar bidak dan gambar contoh |

`npm run db:seed` menimpa baris berdasarkan slug, termasuk perubahan admin pada konten bawaan. Jangan dijalankan ulang setelah konten diubah lewat panel admin.

## Deploy ke Vercel

1. Set **Root Directory** ke `web`.
2. Isi environment variable:

   | Nama | Nilai |
   | --- | --- |
   | `DATABASE_URL` | Transaction pooler port 6543. Lihat `VERCEL_DATABASE_URL` di `.env.local` |
   | `SESSION_SECRET` | String acak panjang |
   | `CRON_SECRET` | String acak panjang |
   | `SITE_URL` | URL website, mis. `https://otsuka-chess.vercel.app` |
   | `PUBLIC_SITE` | Isi `true` hanya bila website boleh diindeks mesin pencari |

3. Cron harian sudah diatur di `vercel.json`. Cron mengisi puzzle harian dan menjaga project Supabase tetap aktif.

## MCP artikel

Server MCP `otsuka-artikel` membuat Claude bisa mengelola Artikel. Sudah terdaftar di `../.mcp.json`, jadi cukup buka Claude Code dari folder `otsuka-chess` dan setujui server-nya.

| Tool | Fungsi |
| --- | --- |
| `list_articles` | Daftar artikel, bisa difilter status dan judul |
| `get_article` | Membaca satu artikel lengkap |
| `create_article` | Membuat artikel, default draf |
| `update_article` | Mengubah artikel, termasuk terbit atau draf |
| `delete_article` | Menghapus artikel permanen |
| `upload_image` | Mengunggah foto lokal untuk sampul atau isi |

Server berjalan di komputer lokal dan langsung menulis ke database lewat `DIRECT_URL` di `.env.local`. Supaya perubahan langsung tampil, isi `SITE_URL` dengan alamat website. `CRON_SECRET` di `.env.local` harus sama dengan yang dipakai website. Bila web tidak terjangkau, halaman publik berubah paling lambat 1 jam kemudian.

## Mengisi data klub

- Beranda (hero, tentang klub, kartu belajar, FAQ, footer): `/admin/beranda`.
- Kegiatan dan Artikel: `/admin/kegiatan` dan `/admin/artikel`.
- Foto: upload langsung dari form admin. Foto dikecilkan di browser lalu disimpan di tabel `media` (kuota database 500 MB).
