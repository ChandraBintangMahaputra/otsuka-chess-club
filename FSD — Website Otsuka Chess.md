# FSD — Website Otsuka Chess

Nov 6, 2026 · @jo

## 1. Pendahuluan

Otsuka Chess adalah klub catur hobi internal perusahaan. Website ini menjadi bahan belajar untuk karyawan yang ingin belajar catur, sekaligus profil dan dokumentasi kegiatan klub. Isinya: landing page klub, halaman Dokumentasi Kegiatan, dan tiga modul belajar (Belajar Dasar, Opening, Puzzle). Hosting di Vercel, database di Supabase.

### 1.1 Ruang lingkup

**Termasuk:**

- Landing page profil klub Otsuka Chess dan ajakan bergabung
- Dokumentasi kegiatan klub (turnamen internal, sesi latihan, gathering), dengan foto disimpan lokal di repo
- Modul Belajar Dasar: aturan dan konsep catur untuk pemula, dengan papan interaktif
- Modul Opening: katalog pembukaan, mode lihat langkah, dan mode latihan
- Modul Puzzle: puzzle taktik dengan validasi langkah, petunjuk, dan puzzle harian
- Register dan login dengan tabel user sendiri (username/email + password)
- Panel admin untuk mengelola konten, anggota, dan data dokumentasi

**Tidak termasuk (versi ini):**

- Bermain catur online melawan anggota lain atau melawan engine
- Supabase Auth, SSO perusahaan, atau login Google
- Penyimpanan file eksternal (Supabase Storage, Synology, S3) dan upload foto lewat website
- Pembayaran online
- Aplikasi mobile native

### 1.2 Istilah

| Istilah | Arti |
| --- | --- |
| FEN | Format teks satu baris yang menyimpan posisi papan, giliran, hak rokade, dan en passant |
| PGN | Format teks untuk menyimpan urutan langkah sebuah partai |
| SAN | Notasi langkah standar yang dibaca manusia, mis. `Nf3`, `O-O` |
| UCI | Notasi langkah berbasis petak asal-tujuan, mis. `g1f3`; dipakai untuk menyimpan solusi puzzle |
| ECO | Kode klasifikasi opening, A00 sampai E99 |
| RLS | Row Level Security di Supabase: aturan siapa boleh membaca atau menulis setiap baris tabel |
| Hash password | Password yang diacak satu arah (bcrypt) sebelum disimpan; password asli tidak pernah disimpan |
| Sesi | Tanda login yang disimpan di cookie browser dan dicocokkan dengan tabel `sessions` |
| Tamu | Pengunjung yang belum login |
| Anggota | Karyawan yang sudah register dan login |

## 2. Gambaran produk

Website punya dua peran: menjadi rumah online klub Otsuka Chess (profil dan dokumentasi kegiatan), dan menjadi tempat belajar mandiri untuk karyawan dari nol sampai bisa ikut turnamen internal.

### 2.1 Tujuan bisnis

1. Karyawan yang belum bisa catur bisa belajar aturan sampai skakmat dasar tanpa harus didampingi.
2. Anggota klub punya tempat latihan opening dan taktik di luar jadwal kumpul.
3. Kegiatan klub terdokumentasi rapi dan bisa dilihat karyawan lain, sehingga menarik anggota baru.
4. Pengurus klub bisa menambah materi, opening, puzzle, dan dokumentasi tanpa mengubah kode aplikasi.

### 2.2 Target pengguna

| Segmen | Kebutuhan utama | Modul yang dipakai |
| --- | --- | --- |
| Karyawan yang tertarik | Tahu apa itu Otsuka Chess, jadwal kumpul, cara bergabung | Landing, Dokumentasi |
| Karyawan pemula | Belajar aturan dari nol dengan contoh langsung di papan | Belajar Dasar |
| Anggota aktif | Latihan opening dan taktik, melihat progres sendiri | Opening, Puzzle, Profil |
| Pengurus klub | Mengelola konten, anggota, dan dokumentasi kegiatan | Admin |

### 2.3 Peran dan hak akses

| Peran | Cara mendapatkan | Hak akses |
| --- | --- | --- |
| Tamu | Tanpa login | Melihat landing page dan dokumentasi; membaca materi, opening, dan puzzle; progres hanya di browser |
| Anggota | Register lalu login dengan username/email dan password | Semua hak Tamu, ditambah progres tersimpan di server, riwayat dan rating puzzle, halaman profil |
| Admin | Pengurus klub; kolom `role` di tabel `users` diubah menjadi `admin` | Semua hak Anggota, ditambah kelola konten, anggota, dan dokumentasi di `/admin` |

## 3. Arsitektur dan stack

Semua logika yang menyentuh database berjalan di server Next.js di Vercel. Browser hanya menampilkan halaman, memvalidasi langkah catur, dan menyimpan cookie sesi.

&#91;embedded content: arsitektur · browser, Vercel, Supabase, repo Git\]

Server Actions menjadi satu-satunya pintu ke Supabase. Foto dokumentasi ikut di repo dan ter-deploy bersama kode.

| Lapisan | Teknologi | Fungsi |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Halaman, Server Actions, middleware |
| Styling | Tailwind CSS + shadcn/ui | Komponen UI yang konsisten |
| Papan catur | `react-chessboard` | Tampilan papan, drag & drop, panah |
| Logika catur | `chess.js` | Validasi langkah, FEN, PGN, deteksi skak/mat/remis |
| Database | Supabase Postgres + `@supabase/supabase-js` (server only) | Konten, anggota, progres |
| Autentikasi | Tabel `users` + `sessions` buatan sendiri, `bcryptjs`, cookie `httpOnly` | Register, login, logout |
| Validasi | Zod | Validasi input form di server |
| Konten | Markdown (`react-markdown`) + komponen papan kustom | Materi dan catatan opening |
| Hosting | Vercel (deploy otomatis dari Git) | Build, CDN, cron |
| Foto | Folder `public/dokumentasi/` + `next/image` | Galeri kegiatan |

Environment variable di Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `CRON_SECRET`.

## 4. Sitemap dan navigasi

Navigasi utama berisi lima menu: Beranda, Belajar, Opening, Puzzle, dan Dokumentasi. Tombol Masuk dan Daftar ada di kanan; setelah login berganti menjadi nama anggota. Di layar HP menu berubah menjadi bottom navigation agar papan catur tetap lega.

| Route | Halaman | Akses | Rendering |
| --- | --- | --- | --- |
| `/` | Landing page klub | Publik | Statis (SSG) |
| `/dokumentasi` | Daftar kegiatan klub, terbaru di atas | Publik | ISR |
| `/dokumentasi/[slug]` | Detail kegiatan dan galeri foto | Publik | ISR |
| `/belajar` | Daftar bab dan materi dasar | Publik | ISR |
| `/belajar/[slug]` | Satu materi dengan papan interaktif | Publik | ISR |
| `/opening` | Katalog opening dengan filter | Publik | ISR |
| `/opening/[slug]` | Detail opening, mode lihat dan mode latihan | Publik | ISR |
| `/puzzle` | Puzzle harian dan puzzle acak | Publik | Dinamis (client) |
| `/puzzle/[id]` | Satu puzzle tertentu, bisa dibagikan | Publik | ISR |
| `/register` | Daftar akun anggota | Publik | Statis + Server Action |
| `/login` | Masuk dengan username/email dan password | Publik | Statis + Server Action |
| `/profil` | Progres belajar, riwayat puzzle, ganti password | Anggota | Dinamis (SSR) |
| `/admin` | Dasbor admin | Admin | Dinamis (SSR) |
| `/admin/materi`, `/admin/opening`, `/admin/puzzle` | Kelola konten | Admin | Dinamis (SSR) |
| `/admin/dokumentasi` | Kelola data kegiatan | Admin | Dinamis (SSR) |
| `/admin/anggota` | Daftar anggota, ubah peran, nonaktifkan, reset password | Admin | Dinamis (SSR) |

ISR artinya halaman dibuat statis lalu diperbarui otomatis setelah admin mengubah konten (revalidate on-demand dari Server Action admin).

## 5. Spesifikasi fungsional

Setiap kebutuhan punya ID agar mudah dirujuk saat development dan testing. Prioritas: **Wajib** (masuk MVP), **Sebaiknya** (fase 2), **Nanti** (fase 3).

### 5.1 Komponen bersama: papan catur

Semua modul belajar memakai satu komponen papan yang sama. Validasi langkah memakai `chess.js` di browser, tampilan papan memakai `react-chessboard`.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| PB-01 | Menerima posisi awal dalam format FEN | Wajib |
| PB-02 | Bidak bisa digerakkan dengan drag atau klik petak asal lalu petak tujuan | Wajib |
| PB-03 | Langkah ilegal ditolak dan bidak kembali ke tempat semula | Wajib |
| PB-04 | Menandai petak tujuan yang legal saat bidak dipilih | Wajib |
| PB-05 | Menampilkan panah dan sorotan petak untuk penjelasan materi | Wajib |
| PB-06 | Pilihan promosi bidak (Menteri, Benteng, Gajah, Kuda) | Wajib |
| PB-07 | Tombol balik papan (lihat dari sisi hitam) | Wajib |
| PB-08 | Ukuran papan menyesuaikan layar, minimal nyaman di lebar 360 px | Wajib |
| PB-09 | Efek suara langkah, makan, dan skak, bisa dimatikan | Sebaiknya |
| PB-10 | Navigasi langkah dengan tombol dan tombol panah keyboard | Wajib |

### 5.2 Landing page

Tujuannya membuat karyawan tertarik bergabung dan mulai belajar. Urutan bagian: Hero, Tentang Klub, Kegiatan Rutin, Jadwal Kumpul, Pengurus, Dokumentasi Terbaru, Mulai Belajar, FAQ, Footer.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| LP-01 | Hero berisi nama klub, tagline, tombol "Gabung Klub" (ke `/register`) dan "Mulai Belajar" (ke `/belajar`) | Wajib |
| LP-02 | Bagian Tentang Klub: sejarah singkat, visi, jumlah anggota | Wajib |
| LP-03 | Bagian Kegiatan Rutin: kartu per kegiatan (latihan mingguan, turnamen internal, sesi untuk pemula) | Wajib |
| LP-04 | Bagian Jadwal Kumpul: hari, jam, lokasi di kantor atau online | Wajib |
| LP-05 | Bagian Pengurus: nama, jabatan di klub, divisi | Sebaiknya |
| LP-06 | Bagian Dokumentasi Terbaru: 3 kegiatan terakhir dari modul Dokumentasi, dengan tautan ke `/dokumentasi` | Wajib |
| LP-07 | Bagian Mulai Belajar: tiga kartu menuju Belajar Dasar, Opening, dan Puzzle | Wajib |
| LP-08 | Cuplikan puzzle harian sebagai ajakan mencoba | Sebaiknya |
| LP-09 | FAQ dalam bentuk accordion (mis. "Saya belum bisa main sama sekali, boleh ikut?") | Wajib |
| LP-10 | Footer: kontak pengurus (WhatsApp grup atau email internal) | Wajib |

Konten landing (teks, jadwal, pengurus, FAQ) ditulis di file konfigurasi `content/landing.ts` agar mudah diubah tanpa panel admin.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| LP-11 | Gambar dan foto landing disimpan di folder `public/` repo | Wajib |
| LP-12 | Tombol "Gabung Klub" berganti menjadi "Lanjut Belajar" bila pengguna sudah login | Sebaiknya |

### 5.3 Belajar Dasar

Materi disusun per bab dan dibaca berurutan. Setiap materi berisi teks penjelasan, papan contoh, dan latihan kecil.

Usulan kurikulum awal:

1. Mengenal papan: petak, baris, kolom, diagonal, notasi koordinat
2. Gerak bidak: Raja, Menteri, Benteng, Gajah, Kuda, Pion
3. Makan bidak dan nilai bidak
4. Langkah khusus: rokade, en passant, promosi
5. Skak, skakmat, dan pat (remis)
6. Cara remis lainnya: pengulangan 3 kali, aturan 50 langkah, materi tidak cukup
7. Prinsip pembukaan: kuasai pusat, kembangkan bidak, amankan raja
8. Skakmat dasar: Raja + Menteri, Raja + Benteng, mat di baris belakang
9. Taktik dasar: garpu, pin, skewer, serangan ganda

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| BD-01 | Halaman daftar bab dengan status tiap materi (belum, sedang, selesai) | Wajib |
| BD-02 | Konten materi ditulis dalam Markdown dan bisa menyisipkan papan dengan sintaks khusus, mis. `::board{fen="..." arrows="e2e4"}` | Wajib |
| BD-03 | Latihan per materi: pengguna diminta melakukan langkah tertentu, sistem mengecek dengan daftar jawaban benar | Wajib |
| BD-04 | Umpan balik langsung: benar (hijau + penjelasan) atau salah (merah + petunjuk) | Wajib |
| BD-05 | Tombol materi sebelumnya dan berikutnya | Wajib |
| BD-06 | Materi ditandai selesai bila semua latihan benar | Wajib |
| BD-07 | Progres tamu disimpan di `localStorage`; saat login, progres digabung ke akun | Sebaiknya |
| BD-08 | Kuis singkat di akhir bab (pilihan ganda atau tebak langkah) | Nanti |

### 5.4 Opening

Katalog pembukaan untuk pemula sampai menengah, dengan penjelasan ide setiap langkah.

Usulan opening awal (10): Italian Game, Ruy Lopez, Scotch Game, London System, Queen's Gambit, Sicilian Defense, French Defense, Caro-Kann Defense, King's Indian Defense, Scandinavian Defense.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| OP-01 | Katalog berupa kartu: nama, kode ECO, warna (Putih/Hitam), level, langkah pertama | Wajib |
| OP-02 | Filter berdasarkan warna, level, dan langkah pertama (1.e4, 1.d4, lainnya); pencarian nama | Wajib |
| OP-03 | Mode Lihat: menjalankan langkah satu per satu dengan penjelasan di setiap langkah | Wajib |
| OP-04 | Daftar langkah (move list) bisa diklik untuk loncat ke posisi tertentu | Wajib |
| OP-05 | Bagian ide utama, rencana tengah permainan, dan jebakan umum | Wajib |
| OP-06 | Variasi: opening punya cabang (mis. Italian → Giuoco Piano, Evans Gambit) | Sebaiknya |
| OP-07 | Mode Latihan: pengguna memainkan sisi yang dipilih, sistem memainkan sisi lawan otomatis; salah langkah diberi tahu dan boleh coba lagi | Sebaiknya |
| OP-08 | Skor latihan: jumlah percobaan dan rangkaian benar terbaik | Sebaiknya |
| OP-09 | Pengulangan berjarak (spaced repetition) untuk hafalan opening | Nanti |

### 5.5 Puzzle

Puzzle taktik dengan solusi pasti. Format data mengikuti database puzzle Lichess agar bisa diimpor langsung.

**Alur penyelesaian puzzle:**

1. Sistem memuat FEN, lalu memainkan langkah pertama dari kolom solusi secara otomatis (langkah lawan yang membuka taktik).
2. Pengguna memainkan langkah berikutnya.
3. Bila langkah sama dengan solusi, sistem memainkan balasan lawan, lalu kembali ke langkah 2.
4. Bila langkah berbeda, puzzle dianggap gagal. Pengguna boleh mencoba lagi atau melihat solusi.
5. Langkah yang memberi skakmat selalu diterima benar, walau berbeda dari solusi tersimpan.
6. Puzzle selesai saat semua langkah solusi habis.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| PZ-01 | Halaman puzzle menampilkan papan, giliran ("Putih melangkah"), tema tersembunyi sampai selesai | Wajib |
| PZ-02 | Validasi langkah sesuai alur di atas | Wajib |
| PZ-03 | Tombol Petunjuk: menyorot bidak yang harus digerakkan | Wajib |
| PZ-04 | Tombol Lihat Solusi: memainkan sisa solusi dengan animasi | Wajib |
| PZ-05 | Tombol Puzzle Berikutnya: mengambil puzzle acak sesuai filter | Wajib |
| PZ-06 | Filter tema (mat dalam 1, mat dalam 2, garpu, pin, dll.) dan rentang kesulitan | Wajib |
| PZ-07 | Puzzle Harian: satu puzzle yang sama untuk semua pengunjung per tanggal (WIB) | Sebaiknya |
| PZ-08 | Riwayat percobaan member: berhasil/gagal, pakai petunjuk, waktu | Sebaiknya |
| PZ-09 | Rating puzzle member, mulai 1200, naik-turun dengan rumus Elo sederhana | Sebaiknya |
| PZ-10 | Puzzle berikutnya disesuaikan dengan rating member (±200) | Sebaiknya |
| PZ-11 | Mode Puzzle Rush (sebanyak mungkin dalam 3 menit) | Nanti |
| PZ-12 | Tautan bagikan puzzle (`/puzzle/[id]`) dengan gambar pratinjau posisi | Nanti |

### 5.6 Akun dan progres

Autentikasi dibuat sendiri dengan tabel `users` dan `sessions` di Supabase Postgres, tanpa Supabase Auth. Semua proses login berjalan di server Next.js (Server Actions), dan browser hanya menyimpan cookie sesi. Login tetap opsional untuk membaca materi; dibutuhkan untuk menyimpan progres.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| AK-01 | Register: nama lengkap, username, email kantor, divisi, password, konfirmasi password | Wajib |
| AK-02 | Validasi register: username 3–20 karakter (huruf kecil, angka, titik, garis bawah) dan unik; email unik; password minimal 8 karakter dengan huruf dan angka | Wajib |
| AK-03 | Password di-hash dengan bcrypt (cost 12) sebelum disimpan; password asli tidak pernah disimpan atau di-log | Wajib |
| AK-04 | Login dengan username atau email + password; pesan gagal dibuat umum ("Username atau password salah") | Wajib |
| AK-05 | Setelah login, server membuat baris di `sessions` dan mengirim cookie `httpOnly`, `secure`, `sameSite=lax`, berlaku 7 hari | Wajib |
| AK-06 | Logout menghapus baris sesi dan cookie | Wajib |
| AK-07 | Middleware Next.js memeriksa cookie sesi untuk route `/profil` dan `/admin` | Wajib |
| AK-08 | Batas percobaan login: 5 kali gagal dalam 15 menit mengunci akun 15 menit | Wajib |
| AK-09 | Ganti password dari halaman profil (wajib isi password lama); semua sesi lain ikut dihapus | Wajib |
| AK-10 | Lupa password: admin me-reset password anggota dan memberi password sementara yang wajib diganti saat login berikutnya | Sebaiknya |
| AK-11 | Halaman profil: nama, divisi, progres Belajar Dasar (persen per bab), opening yang dilatih, rating dan statistik puzzle | Wajib |
| AK-12 | Progres tamu di `localStorage` digabung ke akun saat login pertama | Sebaiknya |
| AK-13 | Streak harian: jumlah hari berturut-turut menyelesaikan minimal satu puzzle atau materi | Nanti |

### 5.7 Admin konten

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| AD-01 | Akses `/admin` hanya untuk `users.role = 'admin'`, dicek di middleware dan di setiap Server Action admin | Sebaiknya |
| AD-02 | CRUD materi: judul, bab, urutan, isi Markdown, latihan, status terbit | Sebaiknya |
| AD-03 | CRUD opening: nama, ECO, warna, level, PGN, catatan per langkah, induk variasi | Sebaiknya |
| AD-04 | CRUD puzzle dan impor CSV berformat Lichess | Sebaiknya |
| AD-05 | Pratinjau papan langsung saat mengisi FEN atau PGN, dengan validasi format | Sebaiknya |
| AD-06 | Kelola anggota: cari, ubah peran (anggota/admin), nonaktifkan akun, reset password | Wajib |
| AD-07 | Kelola data dokumentasi kegiatan (judul, tanggal, deskripsi, daftar path foto) | Sebaiknya |
| AD-08 | Mengatur puzzle harian untuk tanggal tertentu | Sebaiknya |

Di MVP, konten diisi lewat file seed SQL atau Table Editor Supabase, sehingga panel admin bisa menyusul di fase 2.

### 5.8 Dokumentasi kegiatan

Halaman arsip kegiatan klub: turnamen internal, sesi latihan, simultan, gathering. Foto tidak memakai Supabase Storage atau Synology; foto disimpan di folder repo `public/dokumentasi/<slug-kegiatan>/` dan ikut ter-deploy ke Vercel. Database hanya menyimpan data teks dan path foto.

**Alur menambah dokumentasi:**

1. Pengurus mengompres foto (lebar maks. 1600 px, format WebP, target di bawah 300 KB per foto).
2. Foto disalin ke `public/dokumentasi/<slug>/` lalu di-commit dan di-push ke Git.
3. Vercel otomatis build dan deploy ulang.
4. Pengurus mengisi data kegiatan dan daftar nama file foto di `/admin/dokumentasi` (atau di file seed bila admin belum ada).

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| DOK-01 | Daftar kegiatan berupa kartu: foto sampul, judul, tanggal, kategori, terbaru di atas | Wajib |
| DOK-02 | Filter berdasarkan kategori (Turnamen, Latihan, Gathering) dan tahun | Sebaiknya |
| DOK-03 | Detail kegiatan: judul, tanggal, lokasi, deskripsi, galeri foto | Wajib |
| DOK-04 | Galeri dengan lightbox (klik untuk memperbesar, geser kiri/kanan) | Wajib |
| DOK-05 | Foto ditampilkan lewat `next/image` dengan lazy loading | Wajib |
| DOK-06 | Hasil turnamen: tabel peringkat (nama, poin) dan PGN partai final yang bisa diputar di papan | Sebaiknya |
| DOK-07 | Saat admin menyimpan data, sistem memeriksa bahwa setiap path foto benar-benar ada di build; path yang tidak ditemukan ditandai | Sebaiknya |

Konsekuensi pilihan ini: foto tidak bisa ditambah langsung dari website, karena file system Vercel bersifat read-only saat runtime. Ukuran repo perlu dijaga; arahkan total foto di bawah sekitar 500 MB dan pakai Git LFS bila terus bertambah.

## 6. Model data (Supabase Postgres)

Ada 10 tabel dalam satu schema `public`. Semua akses database dilakukan dari server Next.js memakai service role key, karena login tidak memakai Supabase Auth. Browser tidak pernah memegang key Supabase.

### 6.1 Tabel

| Tabel | Kolom utama | Catatan |
| --- | --- | --- |
| `users` | `id uuid pk`, `full_name`, `username unique`, `email unique`, `division`, `password_hash`, `role` ('member' / 'admin'), `is_active bool`, `must_change_password bool`, `puzzle_rating int default 1200`, `failed_login_count int`, `locked_until timestamptz`, `created_at`, `last_login_at` | Username dan email disimpan huruf kecil (pakai `citext` atau `lower()` unique index) |
| `sessions` | `id uuid pk`, `user_id fk → users`, `token_hash`, `expires_at`, `user_agent`, `ip`, `created_at` | Cookie berisi token acak 32 byte; database hanya menyimpan hash SHA-256 token |
| `lessons` | `id`, `slug unique`, `chapter int`, `position int`, `title`, `summary`, `content_md`, `exercises jsonb`, `is_published`, `updated_at` | `exercises` = array `{fen, prompt, answers[], explanation}` |
| `openings` | `id`, `slug unique`, `name`, `eco`, `side` ('white' / 'black'), `level` ('pemula' / 'menengah'), `first_move`, `pgn`, `move_notes jsonb`, `ideas_md`, `parent_id fk → openings`, `is_published` | `parent_id` untuk variasi; `move_notes` = map nomor langkah → penjelasan |
| `puzzles` | `id`, `fen`, `moves text` (UCI dipisah spasi), `rating int`, `themes text[]`, `source` ('lichess' / 'klub'), `source_id`, `is_published` | Index pada `rating` dan GIN pada `themes` |
| `daily_puzzles` | `date date pk`, `puzzle_id fk → puzzles` | Diisi admin atau dipilih otomatis oleh cron Vercel |
| `lesson_progress` | `user_id`, `lesson_id`, `completed_at`; pk (`user_id`, `lesson_id`) |  |
| `opening_progress` | `user_id`, `opening_id`, `attempts int`, `best_streak int`, `last_practiced_at`; pk (`user_id`, `opening_id`) |  |
| `puzzle_attempts` | `id`, `user_id`, `puzzle_id`, `solved bool`, `used_hint bool`, `time_ms int`, `rating_before`, `rating_after`, `created_at` | Satu baris per percobaan pertama; percobaan ulang tidak mengubah rating |
| `activities` | `id`, `slug unique`, `title`, `category` ('turnamen' / 'latihan' / 'gathering' / 'lainnya'), `held_on date`, `location`, `description_md`, `cover_path`, `photo_paths text[]`, `standings jsonb`, `pgn`, `is_published` | Path relatif ke `public/`, mis. `/dokumentasi/turnamen-2026/01.webp` |

### 6.2 Keamanan data (RLS)

RLS diaktifkan di semua tabel tanpa policy untuk role `anon` dan `authenticated`. Artinya akses langsung memakai anon key ke REST API Supabase selalu ditolak. Satu-satunya pintu adalah server Next.js dengan service role key, yang menjalankan pengecekan peran di kode.

| Aturan | Diterapkan di |
| --- | --- |
| Konten (`lessons`, `openings`, `puzzles`, `activities`) hanya ditampilkan bila `is_published = true` untuk non-admin | Query server |
| Data progres hanya dibaca dan ditulis untuk `user_id` milik sesi aktif | Query server |
| Tulis konten dan data anggota hanya untuk `role = 'admin'` | Server Action + middleware |
| Kolom `password_hash` dan `token_hash` tidak pernah dikirim ke client | Query server (select kolom eksplisit) |
| Service role key hanya ada di environment variable Vercel (`SUPABASE_SERVICE_ROLE_KEY`), tanpa prefix `NEXT_PUBLIC_` | Konfigurasi Vercel |

## 7. Kebutuhan non-fungsional

Target utamanya: cepat dibuka di HP karyawan, aman untuk password, dan muat di paket gratis Vercel dan Supabase.

| Aspek | Kebutuhan |
| --- | --- |
| Performa | LCP di bawah 2,5 detik di jaringan 4G; halaman konten memakai SSG/ISR; library papan dimuat hanya di halaman yang butuh (dynamic import) |
| Responsif | Mobile-first; papan catur nyaman dipakai di lebar 360 px; tampilan desktop memakai layout dua kolom (papan + penjelasan) |
| Keamanan password | bcrypt cost 12; batas percobaan login; cookie `httpOnly` + `secure`; validasi input dengan Zod di server; proteksi CSRF bawaan Server Actions |
| Keamanan data | RLS menolak semua akses langsung (6.2); service role key hanya di server; header keamanan (CSP, `X-Frame-Options`) lewat `next.config` |
| Aksesibilitas | Kontras warna WCAG AA; semua tombol bisa dipakai dengan keyboard; langkah catur juga ditulis dalam teks (SAN) untuk pembaca layar |
| Bahasa | Seluruh antarmuka dan materi berbahasa Indonesia; nama opening tetap memakai nama internasional |
| Zona waktu | Puzzle harian dan tanggal kegiatan memakai WIB (Asia/Jakarta) |
| Foto | WebP, lebar maks. 1600 px, di bawah sekitar 300 KB per file, disajikan lewat `next/image` |
| SEO | Metadata dan Open Graph per halaman; `sitemap.xml` dan `robots.txt`. Bila website hanya untuk internal, set `noindex` |
| Batas Supabase gratis | Database 500 MB dan project di-pause setelah 1 minggu tidak aktif ([Supabase Pricing](https://supabase.com/pricing)). Mitigasi: impor puzzle Lichess secukupnya (mis. 20.000–50.000 puzzle pilihan, bukan seluruh database), dan cron harian Vercel yang menjalankan query ringan agar project tidak di-pause |
| Batas Vercel Hobby | Paket Hobby dibatasi untuk penggunaan pribadi non-komersial ([Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). Klub hobi internal tanpa transaksi kemungkinan masih masuk, tetapi karena berjalan atas nama perusahaan, sebaiknya dikonfirmasi; alternatifnya paket Pro |
| Lisensi konten | Puzzle dari database Lichess berlisensi CC0, bebas dipakai ([database.lichess.org](https://database.lichess.org/)). Gambar bidak pakai set yang lisensinya jelas, mis. bawaan `react-chessboard` |
| Backup | Paket gratis Supabase tanpa backup otomatis: jadwalkan `pg_dump` mingguan oleh pengurus, simpan di lokal |

## 8. Rencana rilis dan kriteria penerimaan

Rilis dibagi tiga fase sesuai prioritas di bagian 5. Di Fase 1, konten diisi lewat file seed SQL; panel admin konten menyusul di Fase 2.

&#91;embedded content: rencana rilis · 3 fase, 2 gerbang\]

Fase berikutnya dimulai setelah gerbang di ujung fase sebelumnya terpenuhi.

### 8.2 Kriteria penerimaan MVP

- [ ] Karyawan bisa register, login, logout, dan ganti password; password tersimpan sebagai hash bcrypt
- [ ] Login gagal 5 kali mengunci akun 15 menit
- [ ] Akses langsung ke REST API Supabase dengan anon key ditolak untuk semua tabel
- [ ] Halaman `/profil` dan `/admin` mengalihkan ke `/login` bila belum login; `/admin` menolak anggota biasa
- [ ] Landing page dan Dokumentasi tampil benar di HP lebar 360 px dan desktop
- [ ] Minimal 3 kegiatan terdokumentasi dengan galeri foto dari `public/dokumentasi/`
- [ ] Bab 1–5 Belajar Dasar terbit, setiap materi punya minimal 1 latihan yang tervalidasi
- [ ] 10 opening bisa diputar langkah demi langkah dengan penjelasan
- [ ] Minimal 1.000 puzzle bisa diselesaikan; langkah salah, petunjuk, dan lihat solusi berjalan sesuai alur 5.5
- [ ] Progres materi dan riwayat puzzle anggota tersimpan dan tampil di profil
- [ ] Skor Lighthouse Performance minimal 85 di mobile untuk landing page

## 9. Pertanyaan terbuka

Jawaban pertanyaan berikut bisa mengubah beberapa kebutuhan di atas.

- [ ] Siapa yang boleh register: siapa saja, hanya email domain kantor, atau harus disetujui admin dulu?
- [ ] Apakah modul belajar boleh dibuka tamu, atau wajib login karena khusus karyawan?
- [ ] Website terbuka di internet atau hanya untuk internal (perlu `noindex` atau proteksi tambahan)?
- [ ] Foto dokumentasi memuat wajah karyawan: apakah perlu izin, dan apakah boleh tampil untuk tamu?
- [ ] Boleh memakai logo atau nama perusahaan, atau cukup logo Otsuka Chess sendiri? Warna brand?
- [ ] Akun Vercel dan Supabase atas nama pribadi atau perusahaan? Apakah paket Hobby disetujui (lihat bagian 7)?
- [ ] Domain yang dipakai: subdomain `vercel.app` atau domain sendiri?
- [ ] Isi landing: jadwal kumpul, lokasi, daftar pengurus, jumlah anggota
- [ ] Siapa yang menulis materi Belajar Dasar dan catatan opening: pengurus, atau draf disiapkan lalu direview?
