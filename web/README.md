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
   | `SUPABASE_URL` | Project URL Supabase, mis. `https://<ref>.supabase.co`, untuk Main online |
   | `SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) atau anon key, untuk Main online |

3. Cron harian sudah diatur di `vercel.json`. Cron mengisi puzzle harian dan menjaga project Supabase tetap aktif.
4. Fungsi server dijalankan di region Mumbai (`bom1`, di `vercel.json`), dekat database Supabase di India, agar setiap langkah catur online cepat.

Setelah menambah atau mengubah variable, lakukan **Redeploy**, karena Vercel hanya memakainya untuk deployment baru.

## Main online

Anggota bisa melihat siapa yang sedang membuka halaman Main, saling menantang, dan bermain dengan jam (3+2, 5+3, 10+0, 15+10). Hasilnya mengubah rating Elo bermain (mulai 1200, K=32) yang tampil di `/peringkat`.

**Cara kerja.** Server adalah sumber kebenaran: setiap langkah divalidasi `chess.js` di server, baris permainan dikunci saat diubah, dan jam dihitung dari waktu server. Supabase Realtime hanya dipakai untuk daftar pemain online (Presence) dan sinyal "ada perubahan" (Broadcast). Pesan palsu tidak bisa mengubah permainan karena browser selalu mengambil data dari server. Bila WebSocket tidak tersambung, lobi dan papan otomatis memeriksa server setiap 3 sampai 5 detik.

**Batas paket gratis Supabase Realtime** (dicek 8 November 2026): 200 koneksi bersamaan, 2 juta pesan per bulan, 100 pesan per detik, 20 pesan Presence per detik. Penerapan yang menjaga batas itu:

| Aturan | Efek |
| --- | --- |
| WebSocket hanya dibuka di halaman Main, satu koneksi per tab | Pengunjung halaman lain tidak memakai koneksi |
| Koneksi dilepas bila tab disembunyikan lebih dari 2 menit | Tab yang terlupa tidak menahan kuota 200 koneksi |
| Jam catur dihitung di browser | Tidak ada pesan per detik |
| Satu langkah = 1 sinyal ke lawan (2 pesan) | Satu permainan 80 langkah sekitar 160 pesan |
| Status online dikirim sekali saat masuk lobi atau papan | Di bawah batas 5 pembaruan per 30 detik per browser |

Perkiraan kasar: 50 pemain aktif dengan 20 permainan per hari memakai kurang dari 1 juta pesan per bulan. Pantau di Supabase Dashboard > Usage > Realtime.

**Pengaturan Supabase.** Fitur ini memakai channel publik. Pastikan Realtime > Settings > *Allow public access* aktif. `SUPABASE_ANON_KEY` dibaca server lalu dikirim ke browser halaman Main, jadi memang terlihat di browser. Server menolak bila yang diisi ternyata secret key. Data tetap aman karena semua tabel dikunci RLS tanpa policy, sehingga key itu tidak bisa membaca tabel apa pun.

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
