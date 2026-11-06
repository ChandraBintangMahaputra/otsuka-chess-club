export type OpeningSeed = {
  slug: string;
  name: string;
  eco: string;
  side: "white" | "black";
  level: "pemula" | "menengah";
  first_move: string;
  pgn: string;
  /** Kunci = nomor langkah setengah (ply), mulai dari 1. */
  move_notes: Record<string, string>;
  ideas_md: string;
  parent?: string;
};

export const openings: OpeningSeed[] = [
  {
    slug: "italian-game",
    name: "Italian Game",
    eco: "C50",
    side: "white",
    level: "pemula",
    first_move: "1.e4",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O",
    move_notes: {
      "1": "Putih menguasai pusat dan membuka jalan untuk Gajah serta Menteri.",
      "2": "Hitam menjawab simetris dan ikut mengklaim pusat.",
      "3": "Kuda berkembang sambil menyerang pion e5.",
      "4": "Kuda hitam menjaga e5 dan ikut mengarah ke pusat.",
      "5": "Gajah ke c4 mengincar f7, titik terlemah Hitam di awal partai.",
      "6": "Hitam membalas dengan Gajah yang mengincar f2.",
      "7": "Pion c3 menyiapkan d4 untuk membangun pusat besar.",
      "8": "Kuda berkembang dan menyerang pion e4.",
      "9": "Pion d3 menjaga e4 dengan tenang. Permainan berjalan lambat dan strategis.",
      "10": "Hitam memperkuat e5 dan membuka Gajah c8.",
      "11": "Putih mengamankan Raja.",
      "12": "Hitam melakukan hal yang sama. Kedua pihak siap masuk tengah permainan.",
    },
    ideas_md: `### Ide utama
Kembangkan bidak dengan cepat, incar titik f7, dan siapkan d4 di saat yang tepat.

### Rencana tengah permainan
Pindahkan Kuda b1 lewat d2 ke f1 lalu g3, majukan h3, dan siapkan serangan di sayap Raja.

### Jebakan umum
Hati-hati dengan ...Ng4 yang menyerang f2 bila Putih terlambat rokade.`,
  },
  {
    slug: "giuoco-piano",
    name: "Giuoco Piano",
    eco: "C53",
    side: "white",
    level: "menengah",
    first_move: "1.e4",
    parent: "italian-game",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5",
    move_notes: {
      "7": "Pion c3 menyiapkan dorongan d4.",
      "9": "Berbeda dari jalur tenang, Putih langsung membuka pusat dengan d4.",
      "10": "Hitam wajib makan karena e5 dan Gajah c5 sama-sama diserang.",
      "11": "Putih kini punya pusat pion e4 dan d4.",
      "12": "Skak dari Gajah memaksa Putih menjawab.",
      "13": "Gajah menghalangi skak sambil menawarkan pertukaran.",
      "15": "Kuda makan balik dan berkembang.",
      "16": "Hitam menyerang pusat sebelum Putih sempat memperkuatnya.",
    },
    ideas_md: `### Ide utama
Putih membangun pusat pion klasik. Hitam harus segera menantangnya dengan ...d5.

### Rencana tengah permainan
Putih bermain dengan ruang lebih besar, dan Hitam mengincar pion terisolasi bila pusat pecah.

### Jebakan umum
Bila Hitam terlambat memainkan ...d5, pion e5 Putih mengusir Kuda dan serangan menjadi berbahaya.`,
  },
  {
    slug: "evans-gambit",
    name: "Evans Gambit",
    eco: "C51",
    side: "white",
    level: "menengah",
    first_move: "1.e4",
    parent: "italian-game",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O",
    move_notes: {
      "7": "Putih mengorbankan pion demi waktu dan pusat.",
      "8": "Hitam menerima gambit.",
      "9": "Pion c3 menyerang Gajah dan menyiapkan d4, jadi Putih mendapat tempo.",
      "10": "Gajah mundur ke a5, petak paling populer.",
      "11": "Pusat dibuka selagi Raja hitam masih di e8.",
      "13": "Rokade dulu. Putih unggul perkembangan jauh sebagai ganti pion.",
    },
    ideas_md: `### Ide utama
Korbankan satu pion untuk mendapat pusat dan perkembangan cepat.

### Rencana tengah permainan
Buka garis untuk Benteng dan Gajah, lalu serang Raja hitam sebelum rokade.

### Jebakan umum
Menyerang tanpa perhitungan membuat Putih hanya kalah satu pion. Jaga tempo.`,
  },
  {
    slug: "ruy-lopez",
    name: "Ruy Lopez",
    eco: "C60",
    side: "white",
    level: "menengah",
    first_move: "1.e4",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam menjawab simetris.",
      "3": "Kuda menyerang e5.",
      "4": "Kuda menjaga e5.",
      "5": "Gajah menekan Kuda penjaga e5. Inilah ciri khas Ruy Lopez.",
      "6": "Hitam langsung bertanya kepada Gajah.",
      "7": "Gajah mundur tetapi tetap mengikat Kuda.",
      "8": "Kuda berkembang sambil menyerang e4.",
      "9": "Putih rokade, karena e4 secara taktis tidak benar-benar terancam.",
      "10": "Hitam bersiap rokade.",
      "11": "Benteng menjaga e4 dan menyiapkan tekanan di kolom e.",
      "12": "Hitam mengusir Gajah dari tekanan.",
      "13": "Gajah menempati diagonal panjang ke arah f7.",
      "14": "Pion menjaga e5 dan membuka Gajah c8.",
      "15": "Pion c3 menyiapkan d4 dan memberi Gajah petak mundur di c2.",
      "16": "Hitam menyelesaikan perkembangan dengan rokade.",
    },
    ideas_md: `### Ide utama
Tekan Kuda c6 yang menjaga e5, lalu bangun pusat dengan c3 dan d4.

### Rencana tengah permainan
Putih menekan perlahan dengan Nbd2–f1–g3. Hitam mencari permainan di sayap Menteri.

### Jebakan umum
Jebakan Noah's Ark: pion a6, b5, dan c5 bisa mengurung Gajah Putih di b3 bila lengah.`,
  },
  {
    slug: "scotch-game",
    name: "Scotch Game",
    eco: "C45",
    side: "white",
    level: "pemula",
    first_move: "1.e4",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nxc6 bxc6 6. e5 Qe7 7. Qe2 Nd5",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam menjawab simetris.",
      "3": "Kuda menyerang e5.",
      "4": "Kuda menjaga e5.",
      "5": "Putih langsung membuka pusat pada langkah ketiga.",
      "6": "Hitam makan karena e5 terancam.",
      "7": "Kuda makan balik dan menempati petak pusat yang kuat.",
      "8": "Kuda hitam berkembang dan menyerang e4.",
      "9": "Pertukaran merusak struktur pion Hitam.",
      "10": "Hitam makan ke arah pusat dengan pion b.",
      "11": "Pion mengusir Kuda f6.",
      "12": "Menteri menekan pion e5 yang maju.",
      "13": "Menteri menjaga e5, walaupun menutup Gajah f1 sementara.",
      "14": "Kuda pindah ke pusat dan tetap aktif.",
    },
    ideas_md: `### Ide utama
Buka pusat secepatnya dan dapatkan ruang tanpa memberi Hitam waktu bersiap.

### Rencana tengah permainan
Putih menekan struktur pion Hitam yang rusak. Hitam mengandalkan pasangan Gajah.

### Jebakan umum
Pion e5 yang terlalu maju butuh penjagaan. Jangan biarkan pion itu jatuh gratis.`,
  },
  {
    slug: "london-system",
    name: "London System",
    eco: "D02",
    side: "white",
    level: "pemula",
    first_move: "1.d4",
    pgn: "1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 Bd6 5. Bg3 O-O 6. Nbd2 c5 7. c3",
    move_notes: {
      "1": "Putih menguasai pusat dengan pion d.",
      "2": "Hitam menghentikan pion d dan mengklaim pusat.",
      "3": "Kuda berkembang ke petak alami.",
      "4": "Hitam mengikuti pola yang sama.",
      "5": "Ciri khas London: Gajah keluar sebelum e3 agar tidak terkurung.",
      "6": "Hitam membuka Gajah f8.",
      "7": "Pion e3 menjaga d4 dan membuka Gajah f1.",
      "8": "Hitam menantang Gajah f4.",
      "9": "Gajah mundur tetapi tetap menjaga diagonal penting.",
      "10": "Hitam mengamankan Raja.",
      "11": "Kuda berkembang lewat d2, menjaga e4 dan f3.",
      "12": "Hitam menyerang d4.",
      "13": "Pion c3 mengukuhkan segitiga pion c3-d4-e3 yang sangat kokoh.",
    },
    ideas_md: `### Ide utama
Satu susunan untuk hampir semua jawaban Hitam: d4, Nf3, Bf4, e3, c3, Nbd2, Bd3. Mudah dipelajari.

### Rencana tengah permainan
Tempatkan Kuda di e5, lalu serang sayap Raja dengan f4 atau Menteri ke arah h7.

### Jebakan umum
Waspadai ...Qb6 yang menyerang b2 saat Gajah sudah keluar dari c1.`,
  },
  {
    slug: "queens-gambit",
    name: "Queen's Gambit",
    eco: "D06",
    side: "white",
    level: "menengah",
    first_move: "1.d4",
    pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam memasang pion pusat.",
      "3": "Pion c menantang d5. Ini gambit semu, karena pion mudah direbut kembali.",
      "4": "Hitam menolak gambit dan menjaga d5 dengan e6.",
      "5": "Kuda berkembang dan menambah tekanan pada d5.",
      "6": "Kuda ikut menjaga d5.",
      "7": "Gajah mengikat Kuda f6 yang menjaga d5.",
      "8": "Gajah melepas ikatan.",
      "9": "Putih membuka Gajah f1 dan menjaga pusat.",
      "10": "Hitam mengamankan Raja.",
      "11": "Kuda berkembang ke petak alami.",
      "12": "Kuda hitam mendukung ...c5 dan ...e5 di kemudian hari.",
    },
    ideas_md: `### Ide utama
Tantang pusat Hitam dengan pion c dan dapatkan ruang di sayap Menteri.

### Rencana tengah permainan
Putih sering memainkan serangan minoritas dengan b4–b5. Hitam mencari kebebasan dengan ...c5.

### Jebakan umum
Jangan serakah mempertahankan pion c4 setelah ...dxc4, karena perkembangan lebih penting.`,
  },
  {
    slug: "sicilian-defense",
    name: "Sicilian Defense",
    eco: "B20",
    side: "black",
    level: "menengah",
    first_move: "1.e4",
    pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam mengawasi d4 dari samping dan membuat partai tidak simetris.",
      "3": "Kuda berkembang dan menyiapkan d4.",
      "4": "Hitam menguasai e5 dan membuka Gajah c8.",
      "5": "Putih membuka pusat.",
      "6": "Hitam menukar pion sayap dengan pion pusat. Ini keuntungan jangka panjang.",
      "7": "Kuda makan balik dan menempati pusat.",
      "8": "Kuda menyerang e4 dan memaksa Putih menjaganya.",
      "9": "Kuda menjaga e4.",
      "10": "Ciri khas Najdorf: mencegah Nb5 dan Bb5 serta menyiapkan ...b5.",
    },
    ideas_md: `### Ide utama
Hitam berjuang menang, bukan sekadar menyamakan kedudukan. Kolom c yang setengah terbuka menjadi senjata utama.

### Rencana tengah permainan
Hitam menyerang di sayap Menteri, sering sambil Putih menyerang di sayap Raja.

### Jebakan umum
Hitam tertinggal perkembangan pada awal partai, jadi hati-hati dengan pengorbanan di e6 atau d5.`,
  },
  {
    slug: "french-defense",
    name: "French Defense",
    eco: "C00",
    side: "black",
    level: "pemula",
    first_move: "1.e4",
    pgn: "1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. Nf3 Nc6 7. Be3",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam menyiapkan ...d5 dengan pondasi kokoh.",
      "3": "Putih membangun pusat ideal.",
      "4": "Hitam menantang pusat.",
      "5": "Kuda menjaga e4.",
      "6": "Kuda menyerang e4 dan menambah tekanan.",
      "7": "Pion maju mengusir Kuda dan mengunci pusat.",
      "8": "Kuda mundur ke d7 untuk mendukung ...c5.",
      "9": "Pion f menguatkan rantai pion Putih.",
      "10": "Dorongan khas French: serang pangkal rantai pion di d4.",
      "11": "Kuda menjaga d4.",
      "12": "Kuda menambah tekanan ke d4.",
      "13": "Gajah menjaga d4 dan menyelesaikan perkembangan sayap Menteri.",
    },
    ideas_md: `### Ide utama
Hitam memberi ruang kepada Putih, lalu menyerang rantai pion dari pangkalnya dengan ...c5.

### Rencana tengah permainan
Tekan d4 sekuat mungkin, sering dengan ...Qb6 dan ...cxd4.

### Jebakan umum
Gajah c8 sering terkurung di belakang pion e6. Cari cara mengaktifkannya.`,
  },
  {
    slug: "caro-kann-defense",
    name: "Caro-Kann Defense",
    eco: "B10",
    side: "black",
    level: "pemula",
    first_move: "1.e4",
    pgn: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam menyiapkan ...d5 tanpa menutup Gajah c8.",
      "3": "Putih membangun pusat ideal.",
      "4": "Hitam menantang pusat.",
      "5": "Kuda menjaga e4.",
      "6": "Hitam menukar pion pusat.",
      "7": "Kuda makan balik dan menempati pusat.",
      "8": "Gajah keluar dengan tempo dan menyerang Kuda.",
      "9": "Kuda mundur sambil menyerang Gajah.",
      "10": "Gajah mundur tetap di diagonal aktif.",
      "11": "Putih mengancam h5 untuk mengurung Gajah.",
      "12": "Hitam memberi Gajah petak mundur di h7.",
      "13": "Kuda berkembang.",
      "14": "Kuda menyiapkan ...Ngf6 dan menjaga e5.",
    },
    ideas_md: `### Ide utama
Struktur pion kokoh dengan Gajah c8 yang aktif di luar rantai pion.

### Rencana tengah permainan
Selesaikan perkembangan, rokade, lalu dorong ...c5 untuk menantang pusat.

### Jebakan umum
Hindari ...Ngf6 terlalu cepat pada garis tertentu, karena Nd6# bisa terjadi bila Raja dan Kuda salah tempat.`,
  },
  {
    slug: "kings-indian-defense",
    name: "King's Indian Defense",
    eco: "E60",
    side: "black",
    level: "menengah",
    first_move: "1.d4",
    pgn: "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam mengawasi e4 dari jauh.",
      "3": "Putih mengambil ruang lebih besar.",
      "4": "Hitam menyiapkan fianchetto.",
      "5": "Kuda berkembang.",
      "6": "Gajah di g7 menjadi senjata utama di diagonal panjang.",
      "7": "Putih membangun pusat besar.",
      "8": "Hitam tetap membiarkan pusat itu, sambil menguasai e5.",
      "9": "Kuda berkembang.",
      "10": "Raja hitam aman lebih dulu.",
      "11": "Gajah berkembang.",
      "12": "Hitam akhirnya menantang pusat Putih.",
      "13": "Putih mengamankan Raja.",
      "14": "Kuda menekan d4 dan memaksa Putih mengambil keputusan.",
    },
    ideas_md: `### Ide utama
Biarkan Putih membangun pusat besar, lalu serang dari samping dengan ...e5 dan ...f5.

### Rencana tengah permainan
Setelah pusat terkunci, Hitam menyerang di sayap Raja, Putih di sayap Menteri.

### Jebakan umum
Serangan Hitam harus cepat. Bila terlambat, pion Putih di sayap Menteri lebih dulu tiba.`,
  },
  {
    slug: "scandinavian-defense",
    name: "Scandinavian Defense",
    eco: "B01",
    side: "black",
    level: "pemula",
    first_move: "1.e4",
    pgn: "1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5",
    move_notes: {
      "1": "Putih menguasai pusat.",
      "2": "Hitam langsung menantang e4.",
      "3": "Putih makan pion.",
      "4": "Menteri makan balik. Keluar dini, tetapi rencananya jelas.",
      "5": "Kuda berkembang dengan tempo menyerang Menteri.",
      "6": "Menteri mundur ke a5, di luar jangkauan dan tetap aktif.",
      "7": "Putih mengambil pusat.",
      "8": "Kuda berkembang.",
      "9": "Kuda berkembang.",
      "10": "Pion c6 memberi Menteri petak mundur dan menguatkan d5.",
      "11": "Gajah berkembang ke diagonal aktif.",
      "12": "Gajah c8 keluar sebelum ...e6, pola yang sama dengan Caro-Kann.",
    },
    ideas_md: `### Ide utama
Paksa pertarungan pusat sejak langkah pertama dan susun struktur c6–e6 yang kokoh.

### Rencana tengah permainan
Kembangkan Gajah c8 keluar dari rantai pion, lalu rokade dan selesaikan perkembangan.

### Jebakan umum
Menteri yang keluar dini bisa dikejar. Pastikan petak mundurnya selalu tersedia.`,
  },
];
