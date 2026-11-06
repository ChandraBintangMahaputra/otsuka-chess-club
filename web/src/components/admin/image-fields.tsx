"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { Button, Field, Textarea } from "@/components/ui";
import { alertError } from "@/lib/swal";
import { uploadImage } from "@/lib/upload-image";

function Thumb({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="size-full object-cover" />;
}

function useUpload(onUploaded: (paths: string[]) => void) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    const done: string[] = [];
    try {
      for (const [i, file] of files.entries()) {
        setProgress(`Mengunggah ${i + 1} dari ${files.length}…`);
        done.push(await uploadImage(file));
      }
    } catch (err) {
      await alertError(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setProgress(null);
      if (done.length) onUploaded(done);
    }
  }
  return { input, progress, onChange, open: () => input.current?.click() };
}

/** Satu foto, dipakai untuk sampul Kegiatan dan Artikel. */
export function CoverField({ defaultValue = "" }: { defaultValue?: string }) {
  const [path, setPath] = useState(defaultValue);
  const { input, progress, onChange, open } = useUpload(([p]) => setPath(p));

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold">Foto sampul</p>
      <input type="hidden" name="cover_path" value={path} />
      <input ref={input} type="file" accept="image/*" hidden onChange={onChange} aria-label="Pilih foto sampul" />
      {path && (
        <div className="aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg bg-line">
          <Thumb src={path} alt="Pratinjau foto sampul" />
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={open} disabled={!!progress}>
          <Upload size={16} aria-hidden /> {progress ?? (path ? "Ganti foto" : "Upload foto")}
        </Button>
        {path && (
          <Button variant="ghost" size="sm" onClick={() => setPath("")}>
            Lepas
          </Button>
        )}
      </div>
    </div>
  );
}

/** Isi Markdown dengan tombol untuk menyisipkan foto di posisi kursor. */
export function BodyField({ defaultValue = "" }: { defaultValue?: string }) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(defaultValue);
  const { input, progress, onChange, open } = useUpload((paths) => {
    const at = area.current?.selectionStart ?? body.length;
    const images = paths.map((p) => `![](${p})`).join("\n\n");
    setBody(`${body.slice(0, at)}\n\n${images}\n\n${body.slice(at)}`.trim());
  });

  return (
    <Field
      label="Isi"
      name="body_md"
      help='Mendukung Markdown: **tebal**, ## judul, daftar. Papan catur: ::board{fen="..."} di baris tersendiri.'
    >
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={onChange} aria-label="Pilih foto untuk isi" />
      <Button variant="secondary" size="sm" onClick={open} disabled={!!progress}>
        <ImagePlus size={16} aria-hidden /> {progress ?? "Sisipkan foto"}
      </Button>
      <Textarea
        ref={area}
        id="body_md"
        name="body_md"
        rows={16}
        required
        value={body}
        placeholder="Tulis isi di sini. Pisahkan paragraf dengan satu baris kosong."
        onChange={(e) => setBody(e.target.value)}
        className="font-sans text-base"
      />
    </Field>
  );
}

/** Galeri Dokumentasi: upload banyak foto, pilih sampul, dan hapus dari daftar. */
export function PhotoManager({ defaultPhotos = [], defaultCover = "" }: { defaultPhotos?: string[]; defaultCover?: string }) {
  const [photos, setPhotos] = useState(defaultPhotos);
  const [cover, setCover] = useState(defaultCover);
  const { input, progress, onChange, open } = useUpload((paths) => setPhotos((p) => [...p, ...paths]));
  const activeCover = photos.includes(cover) ? cover : (photos[0] ?? "");

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Foto kegiatan</p>
      <input type="hidden" name="photo_paths" value={photos.join("\n")} />
      <input type="hidden" name="cover_path" value={activeCover} />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={onChange} aria-label="Pilih foto" />

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((src, i) => (
            <li key={src} className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="aspect-[4/3] bg-line">
                <Thumb src={src} alt={`Foto ${i + 1}`} />
              </div>
              <div className="flex items-center justify-between p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={src === activeCover}
                  aria-label={`Jadikan foto ${i + 1} sampul`}
                  onClick={() => setCover(src)}
                >
                  <Star size={16} fill={src === activeCover ? "currentColor" : "none"} aria-hidden />
                  {src === activeCover ? "Sampul" : ""}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Hapus foto ${i + 1}`}
                  onClick={() => setPhotos((p) => p.filter((x) => x !== src))}
                >
                  <Trash2 size={16} aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" size="sm" onClick={open} disabled={!!progress}>
        <Upload size={16} aria-hidden /> {progress ?? "Upload foto"}
      </Button>
      <p className="text-sm text-muted">Foto otomatis dikecilkan sebelum diunggah. Bisa pilih beberapa sekaligus.</p>
    </div>
  );
}
