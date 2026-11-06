"""
Pilih sebagian puzzle dari database Lichess (CC0) dan ubah jadi CSV
yang siap diimpor ke tabel `puzzles` di Supabase.

Cara pakai:
  pip install zstandard
  python pilih_puzzle.py lichess_db_puzzle.csv.zst puzzles_otsuka.csv --jumlah 30000

File sumber: https://database.lichess.org/#puzzles  (lichess_db_puzzle.csv.zst)
File dibaca secara streaming, jadi tidak perlu diekstrak dan hemat RAM.

Cara memilih:
  - Hanya puzzle berkualitas: RatingDeviation <= 90, Popularity >= 80, NbPlays >= 500
  - Dibagi rata per rentang rating (kelipatan 200, dari 400 sampai 2600) supaya
    ada puzzle untuk pemula sampai mahir. Pemula diberi porsi lebih besar.
  - Di tiap rentang dipilih acak (reservoir sampling), hasilnya bisa diulang
    dengan --seed yang sama.
"""

import argparse
import csv
import io
import random
import sys

import zstandard

# Bobot porsi per rentang rating (rentang bawah = lebih banyak, karena anggota mayoritas pemula)
BOBOT_RENTANG = {
    400: 3, 600: 4, 800: 5, 1000: 5, 1200: 5, 1400: 4,
    1600: 3, 1800: 2, 2000: 1.5, 2200: 1, 2400: 0.5,
}

# Tema Lichess yang tidak perlu ditampilkan ke pengguna sebagai filter
TEMA_DIABAIKAN = {"short", "long", "veryLong", "oneMove", "master", "masterVsMaster", "superGM"}


def buka_csv(path):
    if path.endswith(".zst"):
        f = open(path, "rb")
        reader = zstandard.ZstdDecompressor().stream_reader(f)
        return io.TextIOWrapper(reader, encoding="utf-8", newline="")
    return open(path, encoding="utf-8", newline="")


def rentang(rating):
    r = max(400, min(2400, (rating // 200) * 200))
    return r


def main():
    p = argparse.ArgumentParser()
    p.add_argument("sumber", help="lichess_db_puzzle.csv.zst (atau .csv)")
    p.add_argument("hasil", help="nama file CSV hasil, mis. puzzles_otsuka.csv")
    p.add_argument("--jumlah", type=int, default=30000, help="total puzzle yang diambil")
    p.add_argument("--seed", type=int, default=2026)
    p.add_argument("--min-popularity", type=int, default=80)
    p.add_argument("--min-plays", type=int, default=500)
    p.add_argument("--max-deviation", type=int, default=90)
    a = p.parse_args()

    random.seed(a.seed)
    total_bobot = sum(BOBOT_RENTANG.values())
    kuota = {k: max(1, round(a.jumlah * v / total_bobot)) for k, v in BOBOT_RENTANG.items()}
    wadah = {k: [] for k in kuota}   # reservoir per rentang
    dilihat = {k: 0 for k in kuota}  # jumlah kandidat lolos filter per rentang

    dibaca = 0
    with buka_csv(a.sumber) as f:
        for row in csv.DictReader(f):
            dibaca += 1
            if dibaca % 500000 == 0:
                print(f"  {dibaca:,} baris dibaca...", file=sys.stderr)
            try:
                rating = int(row["Rating"])
                if int(row["RatingDeviation"]) > a.max_deviation:
                    continue
                if int(row["Popularity"]) < a.min_popularity:
                    continue
                if int(row["NbPlays"]) < a.min_plays:
                    continue
            except (KeyError, ValueError):
                continue

            k = rentang(rating)
            dilihat[k] += 1
            w = wadah[k]
            if len(w) < kuota[k]:
                w.append(row)
            else:
                j = random.randrange(dilihat[k])
                if j < kuota[k]:
                    w[j] = row

    hasil = [r for k in sorted(wadah) for r in wadah[k]]
    random.shuffle(hasil)

    # Kolom sama dengan tabel `puzzles` di FSD bagian 6.1 (id dibuat otomatis oleh database)
    with open(a.hasil, "w", encoding="utf-8", newline="") as out:
        w = csv.writer(out)
        w.writerow(["fen", "moves", "rating", "themes", "source", "source_id", "is_published"])
        for r in hasil:
            tema = [t for t in r["Themes"].split() if t not in TEMA_DIABAIKAN]
            w.writerow([
                r["FEN"],
                r["Moves"],
                int(r["Rating"]),
                "{" + ",".join(tema) + "}",   # format array Postgres
                "lichess",
                r["PuzzleId"],
                "true",
            ])

    print(f"\nSelesai. {dibaca:,} baris dibaca, {len(hasil):,} puzzle ditulis ke {a.hasil}", file=sys.stderr)
    for k in sorted(wadah):
        print(f"  rating {k}-{k + 199}: {len(wadah[k]):>6,} puzzle (kandidat {dilihat[k]:,})", file=sys.stderr)


if __name__ == "__main__":
    main()
