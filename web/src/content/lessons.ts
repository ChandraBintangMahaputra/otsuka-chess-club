import type { Exercise } from "@/lib/types";

export type LessonSeed = {
  slug: string;
  chapter: number;
  position: number;
  title: string;
  summary: string;
  content_md: string;
  exercises: (Exercise & { expect?: "mate" | "draw" })[];
};

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const lessons: LessonSeed[] = [
  {
    slug: "mengenal-papan",
    chapter: 1,
    position: 1,
    title: "Petak, baris, kolom, dan koordinat",
    summary: "Kenali papan 8×8 dan cara menyebut setiap petak.",
    content_md: `Papan catur punya **64 petak**, tersusun 8 baris dan 8 kolom, dengan warna terang dan gelap bergantian. Saat menyiapkan papan, pastikan petak di pojok kanan bawah setiap pemain berwarna terang.

- **Kolom** berjalan vertikal dan diberi huruf **a** sampai **h**.
- **Baris** berjalan mendatar dan diberi angka **1** sampai **8**.
- **Diagonal** adalah garis petak sewarna yang saling menyentuh di sudut.

Setiap petak punya nama unik dari gabungan kolom dan baris. Petak yang diberi sorotan di bawah ini adalah **e4**: kolom e, baris 4.

::board{fen="${START}" highlight="e4" caption="Petak e4 berada di kolom e, baris 4"}

Putih selalu memulai dari baris 1 dan 2, Hitam dari baris 7 dan 8. Notasi koordinat ini dipakai untuk mencatat seluruh partai, jadi layak dihafal sejak awal.`,
    exercises: [
      {
        fen: START,
        prompt: "Gerakkan pion dari e2 ke petak e4.",
        answers: ["e4"],
        explanation: "Tepat. Kamu baru saja memainkan langkah pembuka paling populer: 1.e4.",
        hint: "Cari pion di kolom e, baris 2, lalu majukan dua petak.",
      },
    ],
  },
  {
    slug: "benteng-gajah-menteri",
    chapter: 2,
    position: 1,
    title: "Benteng, Gajah, dan Menteri",
    summary: "Tiga bidak jarak jauh yang bergerak di garis lurus dan diagonal.",
    content_md: `Tiga bidak ini bisa melangkah sejauh apa pun selama jalurnya kosong. Mereka tidak bisa melompati bidak lain.

**Benteng** bergerak lurus sepanjang baris atau kolom.

::board{fen="4k3/8/8/8/3R4/8/8/4K3 w - - 0 1" arrows="d4d8 d4d1 d4a4 d4h4" caption="Benteng menguasai satu baris dan satu kolom"}

**Gajah** bergerak diagonal, jadi selamanya berada di petak warna yang sama.

::board{fen="4k3/8/8/8/3B4/8/8/4K3 w - - 0 1" arrows="d4a7 d4h8 d4a1 d4g1" caption="Gajah hanya bergerak di diagonal"}

**Menteri** menggabungkan keduanya, sehingga menjadi bidak terkuat di papan.

::board{fen="4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1" arrows="d4d8 d4h4 d4a7 d4h8 d4a1 d4a4 d4d1 d4g1" caption="Menteri bergerak lurus dan diagonal"}`,
    exercises: [
      {
        fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1",
        prompt: "Gerakkan Benteng lurus dari a1 ke a8.",
        answers: ["Ra8"],
        explanation: "Benar. Benteng menyusuri kolom a sampai ujung papan, dan sekarang menyerang Raja hitam.",
        hint: "Benteng bergerak lurus. Tarik ke atas sepanjang kolom a.",
      },
      {
        fen: "4k3/8/8/8/8/8/8/2B1K3 w - - 0 1",
        prompt: "Gerakkan Gajah dari c1 ke h6.",
        answers: ["Bh6"],
        explanation: "Benar. Gajah melintasi diagonal c1–h6 dan tetap di petak gelap.",
        hint: "Gajah bergerak diagonal, ke arah kanan atas.",
      },
    ],
  },
  {
    slug: "raja-kuda-pion",
    chapter: 2,
    position: 2,
    title: "Raja, Kuda, dan Pion",
    summary: "Bidak dengan aturan gerak paling khas.",
    content_md: `**Raja** bergerak satu petak ke segala arah. Raja tidak boleh masuk ke petak yang diserang lawan.

**Kuda** bergerak berbentuk huruf L: dua petak lurus lalu satu petak ke samping. Kuda satu-satunya bidak yang bisa melompati bidak lain.

::board{fen="4k3/8/8/8/3N4/8/8/4K3 w - - 0 1" arrows="d4c6 d4e6 d4f5 d4f3 d4e2 d4c2 d4b3 d4b5" caption="Kuda di tengah papan menjangkau delapan petak"}

**Pion** maju satu petak, atau dua petak bila masih di petak awalnya. Pion tidak pernah mundur, dan cara makannya berbeda: satu petak diagonal ke depan.

::board{fen="4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1" arrows="e4d5 e4f5 e4e5" caption="Pion maju lurus, tetapi makan secara diagonal"}`,
    exercises: [
      {
        fen: "4k3/8/8/8/8/5N2/8/4K3 w - - 0 1",
        prompt: "Lompatkan Kuda dari f3 ke e5.",
        answers: ["Ne5"],
        explanation: "Benar. Dua petak ke atas, satu ke kiri. Itulah bentuk L.",
        hint: "Hitung dua petak ke atas dari f3, lalu satu petak ke kiri.",
      },
      {
        fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
        prompt: "Pion di e2 belum pernah bergerak. Majukan dua petak sekaligus.",
        answers: ["e4"],
        explanation: "Benar. Hak maju dua petak hanya ada pada langkah pertama pion.",
        hint: "Tarik pion dari e2 langsung ke e4.",
      },
    ],
  },
  {
    slug: "makan-dan-nilai-bidak",
    chapter: 3,
    position: 1,
    title: "Makan bidak dan nilai bidak",
    summary: "Kapan pertukaran menguntungkan dan kapan merugikan.",
    content_md: `Bidak **makan** dengan menempati petak bidak lawan, dan bidak lawan itu keluar dari papan. Setiap bidak punya perkiraan nilai untuk menilai pertukaran:

| Bidak | Nilai |
| --- | --- |
| Pion | 1 |
| Kuda | 3 |
| Gajah | 3 |
| Benteng | 5 |
| Menteri | 9 |

Raja tidak punya nilai karena tidak bisa ditukar. Sebelum makan, tanyakan dua hal: berapa nilai bidak yang didapat, dan apakah bidakmu akan dimakan balik?

::board{fen="4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1" arrows="d1d5" caption="Menteri hitam tidak terjaga, Benteng bisa memakannya gratis"}`,
    exercises: [
      {
        fen: "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1",
        prompt: "Menteri hitam tidak dijaga siapa pun. Makan dengan Benteng.",
        answers: ["Rxd5"],
        explanation: "Benar. Kamu mendapat 9 poin tanpa kehilangan apa pun.",
        hint: "Benteng di d1 berada satu kolom dengan Menteri.",
      },
      {
        fen: "4k3/8/1r6/4p3/2N5/8/8/4K3 w - - 0 1",
        prompt: "Kuda bisa makan pion atau Benteng. Pilih yang paling bernilai.",
        answers: ["Nxb6"],
        explanation: "Benar. Benteng bernilai 5, jauh lebih besar dari pion yang bernilai 1.",
        hint: "Bandingkan nilai dua bidak yang bisa dimakan.",
      },
    ],
  },
  {
    slug: "rokade",
    chapter: 4,
    position: 1,
    title: "Rokade",
    summary: "Satu langkah untuk mengamankan Raja dan mengaktifkan Benteng.",
    content_md: `Rokade adalah satu-satunya langkah yang menggerakkan dua bidak sekaligus. Raja bergeser dua petak ke arah Benteng, lalu Benteng melompat ke sisi sebelahnya.

Syarat rokade:

1. Raja dan Benteng itu belum pernah bergerak.
2. Tidak ada bidak di antara keduanya.
3. Raja sedang tidak diskak.
4. Raja tidak melewati atau mendarat di petak yang diserang.

::board{fen="r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1" arrows="e1g1 e1c1" caption="Rokade pendek ke g1, rokade panjang ke c1"}

Di papan ini, lakukan rokade dengan menggerakkan Raja dua petak ke arah Benteng.`,
    exercises: [
      {
        fen: "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
        prompt: "Lakukan rokade pendek: gerakkan Raja dari e1 ke g1.",
        answers: ["O-O"],
        explanation: "Benar. Raja kini aman di g1 dan Benteng aktif di f1.",
        hint: "Tarik Raja dua petak ke kanan, Benteng akan mengikuti.",
      },
    ],
  },
  {
    slug: "en-passant-dan-promosi",
    chapter: 4,
    position: 2,
    title: "En passant dan promosi",
    summary: "Dua aturan khusus pion.",
    content_md: `**En passant.** Bila pion lawan maju dua petak dan mendarat tepat di samping pionmu, kamu boleh memakannya seolah ia hanya maju satu petak. Hak ini hanya berlaku pada langkah berikutnya.

::board{fen="4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2" arrows="e5d6" highlight="d5" caption="Pion hitam baru saja maju d7–d5, pion e5 bisa makan ke d6"}

**Promosi.** Pion yang mencapai baris terakhir wajib berubah menjadi Menteri, Benteng, Gajah, atau Kuda. Hampir selalu pilihan terbaik adalah Menteri.

::board{fen="4k3/P7/8/8/8/8/8/4K3 w - - 0 1" arrows="a7a8" caption="Pion a7 satu langkah lagi menjadi Menteri"}`,
    exercises: [
      {
        fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2",
        prompt: "Hitam baru saja memainkan d7–d5. Makan pion itu secara en passant.",
        answers: ["exd6"],
        explanation: "Benar. Pion mendarat di d6 dan pion hitam di d5 keluar dari papan.",
        hint: "Gerakkan pion e5 diagonal ke d6.",
      },
      {
        fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
        prompt: "Promosikan pion a7 menjadi Menteri.",
        answers: ["a8=Q"],
        explanation: "Benar. Menteri baru langsung memberi skak di sepanjang baris 8.",
        hint: "Majukan pion ke a8, lalu pilih Menteri.",
      },
    ],
  },
  {
    slug: "skak-dan-cara-menjawab",
    chapter: 5,
    position: 1,
    title: "Skak dan tiga cara menjawabnya",
    summary: "Saat Raja diserang, pilihanmu hanya tiga.",
    content_md: `**Skak** artinya Raja sedang diserang. Kamu wajib menyelesaikannya pada langkah berikutnya dengan salah satu cara berikut:

1. **Menyingkir**: pindahkan Raja ke petak aman.
2. **Menghalangi**: tempatkan bidak di antara Raja dan penyerang.
3. **Memakan**: makan bidak yang memberi skak.

::board{fen="4k3/8/8/8/4r3/8/8/4K2B w - - 0 1" arrows="e4e1" caption="Benteng hitam memberi skak di sepanjang kolom e"}

Cara memakan biasanya paling baik karena sekaligus memenangkan materi.`,
    exercises: [
      {
        fen: "4k3/8/8/8/4r3/8/8/4K2B w - - 0 1",
        prompt: "Rajamu diskak Benteng. Selesaikan dengan memakan Benteng itu.",
        answers: ["Bxe4"],
        explanation: "Benar. Gajah di h1 menyusuri diagonal panjang dan memakan penyerang.",
        hint: "Gajahmu berada di diagonal yang sama dengan Benteng.",
      },
    ],
  },
  {
    slug: "skakmat-dan-pat",
    chapter: 5,
    position: 2,
    title: "Skakmat dan pat",
    summary: "Dua cara partai berakhir yang sering tertukar.",
    content_md: `**Skakmat** terjadi bila Raja diskak dan tidak ada cara menyelesaikannya. Partai selesai dan pemberi mat menang.

::board{fen="R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1" arrows="a8g8" caption="Skakmat: Raja terkurung oleh pionnya sendiri"}

**Pat** terjadi bila pemain yang mendapat giliran tidak punya langkah legal, tetapi Rajanya tidak sedang diskak. Hasilnya remis, walau satu pihak unggul jauh.

::board{fen="7k/8/5KQ1/8/8/8/8/8 b - - 0 1" highlight="h8" caption="Pat: Raja hitam tidak diskak, tetapi tidak punya langkah"}

Saat unggul jauh, selalu periksa apakah lawan masih punya langkah. Banyak partai menang berubah remis karena pat.`,
    exercises: [
      {
        fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
        prompt: "Beri skakmat dalam satu langkah.",
        answers: ["Ra8#"],
        explanation: "Benar. Raja hitam terkurung pionnya sendiri dan tidak bisa kabur.",
        hint: "Baris 8 tidak dijaga siapa pun.",
        expect: "mate",
      },
      {
        fen: "7k/8/5K2/6Q1/8/8/8/8 w - - 0 1",
        prompt: "Beri skakmat, dan hati-hati jangan sampai pat.",
        answers: ["Qg7#"],
        explanation: "Benar. Menteri dijaga Raja di f6. Qg6 justru pat, jadi kemenangan bisa hilang.",
        hint: "Menteri perlu berdiri tepat di samping Raja hitam, dijaga Rajamu.",
        expect: "mate",
      },
    ],
  },
  {
    slug: "cara-remis-lainnya",
    chapter: 6,
    position: 1,
    title: "Pengulangan, 50 langkah, dan materi tidak cukup",
    summary: "Partai bisa remis walau kedua Raja masih punya langkah.",
    content_md: `Selain pat, ada tiga aturan remis yang perlu dikenal:

- **Pengulangan tiga kali**: posisi yang sama muncul tiga kali, dengan giliran dan hak yang sama.
- **Aturan 50 langkah**: selama 50 langkah masing-masing pihak, tidak ada pion yang bergerak dan tidak ada bidak yang dimakan.
- **Materi tidak cukup**: tidak mungkin terjadi skakmat. Contohnya Raja lawan Raja, Raja + Gajah lawan Raja, dan Raja + Kuda lawan Raja.

::board{fen="k7/8/8/8/8/4K3/8/7b b - - 0 1" caption="Raja + Gajah tidak bisa memberi skakmat, partai remis"}

Saat tertinggal, carilah peluang ini. Memakan pion terakhir lawan sering menyelamatkan setengah poin.`,
    exercises: [
      {
        fen: "k7/8/8/8/8/4p3/3K4/7b w - - 0 1",
        prompt: "Kamu hanya punya Raja. Makan pion terakhir hitam untuk memaksa remis.",
        answers: ["Kxe3"],
        explanation: "Benar. Tersisa Raja + Gajah lawan Raja, materi tidak cukup untuk mat, jadi partai remis.",
        hint: "Pion di e3 tidak dijaga Gajah.",
        expect: "draw",
      },
    ],
  },
  {
    slug: "prinsip-pembukaan",
    chapter: 7,
    position: 1,
    title: "Kuasai pusat, kembangkan bidak, amankan Raja",
    summary: "Tiga prinsip yang berlaku di hampir semua pembukaan.",
    content_md: `Kamu tidak perlu menghafal ratusan langkah untuk memulai partai dengan baik. Cukup ikuti tiga prinsip:

1. **Kuasai pusat.** Petak e4, d4, e5, dan d5 memberi bidakmu ruang gerak.
2. **Kembangkan bidak.** Keluarkan Kuda dan Gajah lebih dulu, dan hindari menggerakkan bidak yang sama dua kali.
3. **Amankan Raja.** Lakukan rokade dalam sekitar sepuluh langkah pertama.

::board{fen="r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5" arrows="e1g1" caption="Kedua pihak berkembang rapi, Putih siap rokade"}

Mengeluarkan Menteri terlalu dini adalah kesalahan pemula yang paling sering, karena Menteri mudah dikejar bidak yang lebih murah.`,
    exercises: [
      {
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        prompt: "Kembangkan satu Kuda ke petak yang mendukung pusat.",
        answers: ["Nf3", "Nc3"],
        explanation: "Benar. Kuda di f3 atau c3 mengarah ke pusat. Nf3 sekaligus menyerang pion e5.",
        hint: "Kuda paling kuat bila mengarah ke tengah papan.",
      },
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5",
        prompt: "Bidak sudah berkembang. Amankan Raja.",
        answers: ["O-O"],
        explanation: "Benar. Raja aman di g1 dan Benteng siap masuk ke permainan.",
        hint: "Gerakkan Raja dua petak ke kanan.",
      },
    ],
  },
  {
    slug: "mat-menteri-dan-benteng",
    chapter: 8,
    position: 1,
    title: "Mat dengan Raja + Menteri dan Raja + Benteng",
    summary: "Mendorong Raja lawan ke tepi papan.",
    content_md: `Dua pola ini wajib dikuasai karena sering muncul di akhir partai. Idenya sama: **dorong Raja lawan ke tepi**, bawa Rajamu mendekat, lalu beri skak terakhir di sepanjang tepi.

::board{fen="7k/8/6K1/8/8/8/8/1Q6 w - - 0 1" arrows="b1b8" caption="Raja putih menutup jalan keluar, Menteri menutup baris 8"}

Dengan Benteng, polanya serupa, hanya butuh Raja yang berhadapan lebih tepat.

::board{fen="7k/8/6K1/8/8/8/8/1R6 w - - 0 1" arrows="b1b8" caption="Benteng memberi mat di baris terakhir"}`,
    exercises: [
      {
        fen: "7k/8/6K1/8/8/8/8/1Q6 w - - 0 1",
        prompt: "Beri skakmat dengan Menteri.",
        answers: ["Qb8#"],
        explanation: "Benar. Menteri menguasai baris 8, Raja putih menguasai g7 dan h7.",
        hint: "Kuasai seluruh baris tempat Raja hitam berdiri.",
        expect: "mate",
      },
      {
        fen: "7k/8/6K1/8/8/8/8/1R6 w - - 0 1",
        prompt: "Beri skakmat dengan Benteng.",
        answers: ["Rb8#"],
        explanation: "Benar. Pola yang sama juga berlaku untuk Benteng.",
        hint: "Bawa Benteng ke baris 8.",
        expect: "mate",
      },
    ],
  },
  {
    slug: "mat-baris-belakang",
    chapter: 8,
    position: 2,
    title: "Mat di baris belakang",
    summary: "Pola mat paling umum di partai pemula.",
    content_md: `Raja yang sudah rokade sering terkurung oleh tiga pion di depannya. Bila baris belakang tidak dijaga, satu Benteng atau Menteri cukup untuk mengakhiri partai.

::board{fen="6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1" arrows="d1d8" caption="Tiga pion hitam justru mengurung Rajanya sendiri"}

Untuk mencegahnya, buat "jendela" bagi Raja dengan memajukan satu pion, misalnya h6, saat waktunya tepat.`,
    exercises: [
      {
        fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
        prompt: "Manfaatkan baris belakang hitam yang kosong.",
        answers: ["Rd8#"],
        explanation: "Benar. Raja tidak punya petak kabur karena terhalang pionnya sendiri.",
        hint: "Benteng di d1 punya jalur bebas ke atas.",
        expect: "mate",
      },
    ],
  },
  {
    slug: "garpu-pin-skewer",
    chapter: 9,
    position: 1,
    title: "Garpu, pin, dan skewer",
    summary: "Tiga taktik yang memenangkan materi.",
    content_md: `**Garpu** (serangan ganda): satu bidak menyerang dua sasaran sekaligus, sehingga lawan hanya bisa menyelamatkan satu.

::board{fen="4k3/8/3N4/1q6/8/8/8/4K3 b - - 1 1" arrows="d6e8 d6b5" caption="Kuda di d6 menyerang Raja dan Menteri sekaligus"}

**Pin**: bidak lawan tidak bisa atau tidak boleh bergerak karena bidak di belakangnya lebih berharga.

::board{fen="4k3/8/2n5/1B6/8/8/8/4K3 b - - 1 1" arrows="b5e8" caption="Kuda c6 terpin ke Raja, jadi tidak boleh bergerak"}

**Skewer**: kebalikan pin. Bidak berharga di depan diserang, dan saat menyingkir, bidak di belakangnya dimakan.

::board{fen="3q4/8/8/3k4/8/8/8/3RK3 b - - 1 1" arrows="d1d5" caption="Raja harus minggir, lalu Menteri di d8 dimakan"}`,
    exercises: [
      {
        fen: "4k3/8/8/1q6/4N3/8/8/4K3 w - - 0 1",
        prompt: "Temukan garpu Kuda terhadap Raja dan Menteri.",
        answers: ["Nd6+"],
        explanation: "Benar. Skak memaksa Raja bergerak, lalu Menteri di b5 dimakan.",
        hint: "Cari petak yang menyerang e8 dan b5 sekaligus.",
      },
      {
        fen: "4k3/8/2n5/8/8/8/8/4KB2 w - - 0 1",
        prompt: "Pin Kuda hitam ke Rajanya.",
        answers: ["Bb5"],
        explanation: "Benar. Kuda tidak boleh bergerak karena Raja di belakangnya akan terskak.",
        hint: "Letakkan Gajah di diagonal yang melewati c6 dan e8.",
      },
      {
        fen: "3q4/8/8/3k4/8/8/8/R3K3 w - - 0 1",
        prompt: "Beri skewer kepada Raja dan Menteri di kolom d.",
        answers: ["Rd1+"],
        explanation: "Benar. Raja harus meninggalkan kolom d, lalu Benteng memakan Menteri.",
        hint: "Tempatkan Benteng satu kolom dengan keduanya.",
      },
    ],
  },
];
