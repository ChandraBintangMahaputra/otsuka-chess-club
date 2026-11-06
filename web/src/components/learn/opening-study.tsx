"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Check, RotateCcw, X } from "lucide-react";
import { recordOpeningPracticeAction } from "@/actions/learning";
import { ChessBoard, type BoardMove } from "@/components/chess/chess-board";
import { GameViewer, parsePgn } from "@/components/chess/game-viewer";
import { useMe } from "@/components/site/me-provider";
import { Button, cn } from "@/components/ui";

type Side = "white" | "black";

/** OP-07: pengguna memainkan satu sisi, sistem memainkan sisi lawan otomatis. */
function Practice({ openingId, pgn, defaultSide }: { openingId: string; pgn: string; defaultSide: Side }) {
  const { user } = useMe();
  const { moves, fens } = useMemo(() => parsePgn(pgn), [pgn]);
  const [side, setSide] = useState<Side>(defaultSide);
  const [ply, setPly] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const recorded = useRef(false);

  const myTurn = (ply % 2 === 0) === (side === "white");
  const finished = ply >= moves.length;
  const current = ply > 0 ? moves[ply - 1] : null;
  const lastMove = useMemo(
    () => (current ? { from: current.from, to: current.to, san: current.san } : null),
    [current],
  );

  const restart = useCallback(() => {
    setPly(0);
    setError(null);
    setMistakes(0);
    setStreak(0);
    recorded.current = false;
  }, []);

  useEffect(() => {
    if (finished || myTurn) return;
    const t = setTimeout(() => setPly((p) => p + 1), 550);
    return () => clearTimeout(t);
  }, [finished, myTurn, ply]);

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    if (user) recordOpeningPracticeAction(openingId, best).catch(() => {});
  }, [finished, user, openingId, best]);

  function onMove(input: BoardMove) {
    if (finished || !myTurn) return false;
    const chess = new Chess(fens[ply]);
    const played = chess.move(input);
    if (played.san !== moves[ply].san) {
      setError(`${played.san} bukan langkah di jalur ini. Coba lagi.`);
      setMistakes((m) => m + 1);
      setStreak(0);
      return false;
    }
    setError(null);
    setStreak((s) => {
      setBest((b) => Math.max(b, s + 1));
      return s + 1;
    });
    setPly((p) => p + 1);
    return true;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="mx-auto w-full max-w-[560px]">
        <ChessBoard
          fen={fens[ply]}
          orientation={side}
          interactive={myTurn && !finished}
          onMove={onMove}
          lastMove={lastMove}
          label="Papan latihan opening"
        />
      </div>
      <div className="space-y-4">
        <fieldset className="rounded-xl border border-line bg-surface p-4">
          <legend className="px-1 text-sm font-semibold">Mainkan sisi</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["white", "black"] as const).map((s) => (
              <Button
                key={s}
                variant={side === s ? "primary" : "secondary"}
                aria-pressed={side === s}
                onClick={() => {
                  setSide(s);
                  restart();
                }}
              >
                {s === "white" ? "Putih" : "Hitam"}
              </Button>
            ))}
          </div>
        </fieldset>

        <div aria-live="polite" className="min-h-14">
          {finished ? (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft p-3 font-semibold text-success">
              <Check size={18} aria-hidden /> Jalur selesai{mistakes === 0 ? " tanpa salah!" : `, ${mistakes} kali salah.`}
            </p>
          ) : error ? (
            <p className="flex items-center gap-2 rounded-lg bg-danger-soft p-3 font-semibold text-danger">
              <X size={18} aria-hidden /> {error}
            </p>
          ) : (
            <p className="font-semibold">{myTurn ? "Giliranmu. Mainkan langkah berikutnya." : "Lawan melangkah…"}</p>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Percobaan", attempts],
            ["Rangkaian", streak],
            ["Terbaik", best],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-surface p-3">
              <dd className="font-display text-2xl font-semibold">{value}</dd>
              <dt className="text-xs text-muted">{label}</dt>
            </div>
          ))}
        </dl>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setAttempts((a) => a + 1);
            restart();
          }}
        >
          <RotateCcw size={18} aria-hidden /> Ulangi dari awal
        </Button>
      </div>
    </div>
  );
}

export function OpeningStudy({
  openingId,
  pgn,
  notes,
  side,
}: {
  openingId: string;
  pgn: string;
  notes?: Record<string, string>;
  side: Side;
}) {
  const [mode, setMode] = useState<"lihat" | "latihan">("lihat");
  // Jalur yang terlalu pendek tidak bisa dilatih.
  const canPractice = useMemo(() => parsePgn(pgn).moves.length >= 4, [pgn]);

  if (!canPractice) return <GameViewer pgn={pgn} notes={notes} orientation={side} />;

  return (
    <div>
      <div role="tablist" aria-label="Mode opening" className="mb-5 inline-flex rounded-lg border border-line bg-surface p-1">
        {(
          [
            ["lihat", "Mode Lihat"],
            ["latihan", "Mode Latihan"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "min-h-10 rounded-md px-4 text-sm font-semibold transition-colors duration-150",
              mode === value ? "bg-forest text-on-forest" : "text-ink hover:bg-line/50",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "lihat" ? (
        <GameViewer pgn={pgn} notes={notes} orientation={side} />
      ) : (
        <Practice openingId={openingId} pgn={pgn} defaultSide={side} />
      )}
    </div>
  );
}
