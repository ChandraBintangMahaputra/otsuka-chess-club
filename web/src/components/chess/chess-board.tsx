"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Chess, type Square } from "chess.js";
import { FlipVertical2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui";
import { playMoveSound, setSoundEnabled, soundEnabled } from "@/lib/sound";

// Library papan hanya dimuat di halaman yang memakainya (FSD 7).
const Chessboard = dynamic(() => import("react-chessboard").then((m) => m.Chessboard), {
  ssr: false,
  loading: () => <div className="aspect-square w-full animate-pulse rounded-lg bg-line" />,
});

export type BoardMove = { from: string; to: string; promotion?: string };
export type SquareMark = "hint" | "good" | "bad";

const MARK_STYLE: Record<SquareMark, React.CSSProperties> = {
  hint: { background: "rgba(232, 185, 58, 0.75)" },
  good: { background: "rgba(23, 105, 63, 0.55)" },
  bad: { background: "rgba(180, 35, 24, 0.55)" },
};

const LAST_MOVE: React.CSSProperties = { background: "rgba(232, 185, 58, 0.38)" };
const SELECTED: React.CSSProperties = { background: "rgba(31, 77, 63, 0.45)" };
const LEGAL_DOT: React.CSSProperties = {
  background: "radial-gradient(circle, rgba(20, 51, 41, 0.42) 22%, transparent 24%)",
};
const LEGAL_CAPTURE: React.CSSProperties = {
  background: "radial-gradient(circle, transparent 62%, rgba(20, 51, 41, 0.42) 64%)",
};

const PROMOTIONS = [
  { value: "q", label: "Menteri", piece: "Q" },
  { value: "r", label: "Benteng", piece: "R" },
  { value: "b", label: "Gajah", piece: "B" },
  { value: "n", label: "Kuda", piece: "N" },
];

const subscribeNothing = () => () => {};

export function ChessBoard({
  fen,
  orientation = "white",
  interactive = false,
  onMove,
  arrows = [],
  marks = {},
  lastMove,
  label,
}: {
  fen: string;
  orientation?: "white" | "black";
  interactive?: boolean;
  /** Mengembalikan false bila langkah ditolak, bidak kembali ke tempat semula. */
  onMove?: (move: BoardMove) => boolean;
  arrows?: string[];
  marks?: Record<string, SquareMark>;
  lastMove?: { from: string; to: string; san: string } | null;
  label: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  const [soundChoice, setSoundChoice] = useState<boolean | null>(null);
  const storedSound = useSyncExternalStore(subscribeNothing, soundEnabled, () => true);
  const sound = soundChoice ?? storedSound;
  const [boardFen, setBoardFen] = useState(fen);

  // Pilihan petak tidak berlaku lagi saat posisi berubah.
  if (boardFen !== fen) {
    setBoardFen(fen);
    setSelected(null);
    setPromotion(null);
  }

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return null;
    }
  }, [fen]);

  useEffect(() => {
    if (lastMove) playMoveSound(lastMove.san);
  }, [lastMove]);

  const targets = useMemo(
    () => (chess && selected ? chess.moves({ square: selected as Square, verbose: true }) : []),
    [chess, selected],
  );

  function attempt(from: string, to: string) {
    if (!chess || !interactive) return false;
    const legal = chess.moves({ square: from as Square, verbose: true }).filter((m) => m.to === to);
    if (!legal.length) return false;
    if (legal.some((m) => m.promotion)) {
      setPromotion({ from, to });
      return false;
    }
    setSelected(null);
    return onMove?.({ from, to }) ?? false;
  }

  function onSquare(square: string) {
    if (!chess || !interactive) return;
    if (selected && selected !== square && attempt(selected, square)) return;
    if (selected && targets.some((m) => m.to === square)) return;
    const piece = chess.get(square as Square);
    setSelected(piece && piece.color === chess.turn() && square !== selected ? square : null);
  }

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = LAST_MOVE;
    squareStyles[lastMove.to] = LAST_MOVE;
  }
  if (selected) squareStyles[selected] = SELECTED;
  for (const m of targets) squareStyles[m.to] = m.captured ? LEGAL_CAPTURE : LEGAL_DOT;
  for (const [square, mark] of Object.entries(marks)) squareStyles[square] = MARK_STYLE[mark];

  const boardOrientation = flipped ? (orientation === "white" ? "black" : "white") : orientation;
  const promoColor = chess?.turn() ?? "w";

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg" role="group" aria-label={label}>
        <Chessboard
          options={{
            position: fen,
            boardOrientation,
            allowDragging: interactive,
            allowDrawingArrows: false,
            animationDurationInMs: 180,
            lightSquareStyle: { backgroundColor: "var(--sq-light)" },
            darkSquareStyle: { backgroundColor: "var(--sq-dark)" },
            squareStyles,
            arrows: arrows.map((a) => ({
              startSquare: a.slice(0, 2),
              endSquare: a.slice(2, 4),
              color: "#a84c1a",
            })),
            canDragPiece: ({ piece }) =>
              interactive && !!chess && piece.pieceType[0] === chess.turn(),
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              targetSquare ? attempt(sourceSquare, targetSquare) : false,
            onSquareClick: ({ square }) => onSquare(square),
          }}
        />

        {promotion && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-ink/50 p-4">
            <div role="dialog" aria-label="Pilih bidak promosi" className="rounded-xl bg-surface p-3 shadow-lg">
              <p className="mb-2 text-center text-sm font-semibold">Promosi menjadi</p>
              <div className="grid grid-cols-4 gap-2">
                {PROMOTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    aria-label={p.label}
                    onClick={() => {
                      const move = { ...promotion, promotion: p.value };
                      setPromotion(null);
                      setSelected(null);
                      onMove?.(move);
                    }}
                    className="size-14 rounded-lg border border-line p-1 hover:border-forest hover:bg-forest/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/pieces/${promoColor}${p.piece}.svg`} alt="" className="size-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label={sound ? "Matikan suara" : "Nyalakan suara"}
          onClick={() => {
            setSoundEnabled(!sound);
            setSoundChoice(!sound);
          }}
        >
          {sound ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFlipped((f) => !f)}>
          <FlipVertical2 size={18} aria-hidden />
          Balik papan
        </Button>
      </div>
    </div>
  );
}
