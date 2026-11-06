"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/** DOK-04: galeri dengan lightbox, klik untuk memperbesar, geser kiri/kanan. */
export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const count = photos.length;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  const go = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + count) % count));

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        {photos.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Perbesar foto ${i + 1} dari ${count}`}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-line"
            >
              <Image
                src={src}
                alt={`${title}, foto ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover transition-transform duration-200 hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label="Foto kegiatan"
        onClose={() => setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-on-forest backdrop:bg-ink/95"
      >
        {index !== null && (
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between p-3">
              <p className="text-sm">
                {index + 1} / {count}
              </p>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setIndex(null)}
                className="grid size-11 place-items-center rounded-lg hover:bg-white/10"
              >
                <X aria-hidden />
              </button>
            </div>
            <div className="relative flex-1">
              <Image src={photos[index]} alt={`${title}, foto ${index + 1}`} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="flex justify-center gap-3 p-3">
              <button
                type="button"
                aria-label="Foto sebelumnya"
                onClick={() => go(-1)}
                className="grid size-11 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <ChevronLeft aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Foto berikutnya"
                onClick={() => go(1)}
                className="grid size-11 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <ChevronRight aria-hidden />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
