"use client";

const MAX_WIDTH = 1600;
const QUALITY = 0.82;

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Mengecilkan foto di browser (FSD 7: lebar maks. 1600 px, WebP) sebelum dikirim. */
async function compress(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${file.name} tidak bisa dibaca. Gunakan foto JPG, PNG, atau WebP.`);
  }
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Safari tidak bisa menulis WebP dan diam-diam memberi PNG, jadi pakai JPEG.
  const webp = await toBlob(canvas, "image/webp");
  const blob = webp?.type === "image/webp" ? webp : await toBlob(canvas, "image/jpeg");
  if (!blob) throw new Error(`${file.name} gagal diproses.`);
  return blob;
}

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", await compress(file), "foto");
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const data: { path?: string; error?: string } = await res.json().catch(() => ({}));
  if (!res.ok || !data.path) throw new Error(data.error ?? "Upload gagal. Coba lagi.");
  return data.path;
}
