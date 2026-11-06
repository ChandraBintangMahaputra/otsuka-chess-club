"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { ChessBoard } from "./chess-board";

export function parsePgn(pgn: string) {
  const game = new Chess();
  game.loadPgn(pgn);
  const moves = game.history({ verbose: true });
  return {
    moves,
    fens: [moves[0]?.before ?? new Chess().fen(), ...moves.map((m) => m.after)],
  };
}

/** Pemutar partai: tombol, tombol panah keyboard, dan daftar langkah yang bisa diklik. */
export function GameViewer({
  pgn,
  notes,
  orientation = "white",
  initialPly = 0,
}: {
  pgn: string;
  notes?: Record<string, string>;
  orientation?: "white" | "black";
  initialPly?: number;
}) {
  const { moves, fens } = useMemo(() => parsePgn(pgn), [pgn]);
  const [ply, setPly] = useState(initialPly);
  const last = moves.length;
  const current = ply > 0 ? moves[ply - 1] : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.key === "ArrowLeft") setPly((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setPly((p) => Math.min(last, p + 1));
      if (e.key === "Home") setPly(0);
      if (e.key === "End") setPly(last);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  const lastMove = useMemo(
    () => (current ? { from: current.from, to: current.to, san: current.san } : null),
    [current],
  );

  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push({ no: i / 2 + 1, w: i, b: i + 1 });

  const moveButton = (i: number) =>
    moves[i] && (
      <button
        type="button"
        onClick={() => setPly(i + 1)}
        aria-current={ply === i + 1 ? "true" : undefined}
        className={cn(
          "min-h-9 rounded px-2 text-left font-medium transition-colors duration-150",
          ply === i + 1 ? "bg-forest text-on-forest" : "hover:bg-line/60",
        )}
      >
        {moves[i].san}
      </button>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="mx-auto w-full max-w-[560px]">
        <ChessBoard
          fen={fens[ply]}
          orientation={orientation}
          lastMove={lastMove}
          label={`Papan partai, posisi setelah ${current?.san ?? "awal"}`}
        />
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant="secondary" aria-label="Ke awal" onClick={() => setPly(0)} disabled={ply === 0}>
            <ChevronFirst size={20} aria-hidden />
          </Button>
          <Button
            variant="secondary"
            aria-label="Langkah sebelumnya"
            onClick={() => setPly((p) => Math.max(0, p - 1))}
            disabled={ply === 0}
            className="flex-1"
          >
            <ChevronLeft size={20} aria-hidden />
          </Button>
          <Button
            aria-label="Langkah berikutnya"
            onClick={() => setPly((p) => Math.min(last, p + 1))}
            disabled={ply === last}
            className="flex-1"
          >
            <ChevronRight size={20} aria-hidden />
          </Button>
          <Button variant="secondary" aria-label="Ke akhir" onClick={() => setPly(last)} disabled={ply === last}>
            <ChevronLast size={20} aria-hidden />
          </Button>
        </div>

        {notes && (
          <div aria-live="polite" className="min-h-24 rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-copper">
              {current ? `${Math.ceil(ply / 2)}${ply % 2 ? "." : "..."} ${current.san}` : "Posisi awal"}
            </p>
            <p className="mt-1">{current ? (notes[ply] ?? "Lanjutkan ke langkah berikutnya.") : "Tekan panah kanan untuk mulai."}</p>
          </div>
        )}

        <ol className="grid max-h-72 grid-cols-[2.5rem_1fr_1fr] gap-x-1 overflow-y-auto rounded-xl border border-line bg-surface p-2 text-[15px]">
          {pairs.map((p) => (
            <li key={p.no} className="col-span-3 grid grid-cols-subgrid items-center">
              <span className="pl-1 text-sm text-muted">{p.no}.</span>
              {moveButton(p.w)}
              {moveButton(p.b)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
