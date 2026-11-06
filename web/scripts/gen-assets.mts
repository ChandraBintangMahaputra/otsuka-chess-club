import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultPieces } from "react-chessboard";
import sharp from "sharp";
import { activities, photoPaths } from "../src/content/activities.ts";

// Bidak bawaan react-chessboard diekspor ke SVG agar papan statis tidak butuh JavaScript.
mkdirSync("public/pieces", { recursive: true });
for (const [name, Piece] of Object.entries(defaultPieces)) {
  const svg = renderToStaticMarkup(createElement(Piece as never));
  const withNs = svg.includes("xmlns=") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  writeFileSync(`public/pieces/${name}.svg`, withNs);
}

// Gambar pengganti untuk data contoh dokumentasi, bukan foto kegiatan sungguhan.
const TONES = ["#1f4d3f", "#2f6a58", "#8a5a2b", "#3d5a6c", "#6b4f3a", "#274b5a"];

function placeholder(index: number, title: string) {
  const tone = TONES[index % TONES.length];
  const cells: string[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 16; c++) {
      if ((r + c) % 2 === 0) continue;
      cells.push(`<rect x="${c * 100}" y="${r * 100}" width="100" height="100" fill="#fff" opacity="0.05"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <rect width="1600" height="900" fill="${tone}"/>${cells.join("")}
    <text x="80" y="770" font-family="Georgia, serif" font-size="64" fill="#fbf7ee">${title}</text>
    <text x="80" y="830" font-family="Arial, sans-serif" font-size="32" fill="#fbf7ee" opacity="0.8">Gambar contoh, ganti dengan foto kegiatan</text>
  </svg>`;
}

for (const a of activities) {
  const paths = photoPaths(a);
  for (let i = 0; i < paths.length; i++) {
    const out = path.join("public", paths[i]);
    mkdirSync(path.dirname(out), { recursive: true });
    await sharp(Buffer.from(placeholder(i, a.title.replace("Contoh: ", ""))))
      .webp({ quality: 72 })
      .toFile(out);
  }
}
console.log("aset selesai");
