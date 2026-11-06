"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Chess, type Move } from "chess.js";
import { ArrowRight, Check, Eye, Lightbulb, RotateCcw, X } from "lucide-react";
import { nextPuzzleAction, recordAttemptAction } from "@/actions/learning";
import { ChessBoard, type BoardMove, type SquareMark } from "@/components/chess/chess-board";
import { useMe } from "@/components/site/me-provider";
import { Badge, Button, buttonClass, Field, Select } from "@/components/ui";
import { PuzzleGame } from "@/lib/puzzle-engine";
import { PUZZLE_LEVELS, PUZZLE_THEMES, themeLabel, type Puzzle } from "@/lib/types";

type Status = "loading" | "playing" | "wrong" | "solved" | "revealed";
type LastMove = { from: string; to: string; san: string } | null;

const REPLY_DELAY = 450;
const OPENING_DELAY = 600;

const toLast = (m: Move): LastMove => ({ from: m.from, to: m.to, san: m.san });

export function PuzzleTrainer({ initial, title }: { initial: Puzzle | null; title: string }) {
  const [puzzle, setPuzzle] = useState(initial);
  const [heading, setHeading] = useState(title);

  if (!puzzle) {
    return <p className="rounded-xl border border-line bg-surface p-6">Puzzle belum tersedia.</p>;
  }
  return (
    <PuzzleRound
      key={puzzle.id}
      puzzle={puzzle}
      heading={heading}
      onNext={(p) => {
        setPuzzle(p);
        setHeading("Puzzle acak");
      }}
    />
  );
}

function PuzzleRound({
  puzzle,
  heading,
  onNext,
}: {
  puzzle: Puzzle;
  heading: string;
  onNext: (p: Puzzle) => void;
}) {
  const { user } = useMe();
  const [fen, setFen] = useState(puzzle.fen);
  const [status, setStatus] = useState<Status>("loading");
  const [lastMove, setLastMove] = useState<LastMove>(null);
  const [marks, setMarks] = useState<Record<string, SquareMark>>({});
  const [played, setPlayed] = useState<string[]>([]);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);
  const [theme, setTheme] = useState("");
  const [level, setLevel] = useState("");
  const [empty, setEmpty] = useState(false);
  const [pending, startTransition] = useTransition();

  const game = useRef<PuzzleGame | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const started = useRef(0);
  const usedHint = useRef(false);
  const reported = useRef(false);
  const busy = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const startPosition = useCallback(() => {
    const g = game.current;
    if (!g) return;
    busy.current = true;
    later(() => {
      const opening = g.index === 0 ? g.playOpening() : g.reset();
      setFen(g.fen);
      setLastMove(toLast(opening));
      setPlayed([opening.san]);
      setStatus("playing");
      started.current = performance.now();
      busy.current = false;
    }, OPENING_DELAY);
  }, [later]);

  useEffect(() => {
    game.current = new PuzzleGame(puzzle);
    startPosition();
    return clearTimers;
  }, [puzzle, startPosition, clearTimers]);

  /** Hanya percobaan pertama yang dicatat dan memengaruhi rating (FSD 6.1). */
  function report(solved: boolean) {
    if (reported.current) return;
    reported.current = true;
    if (!user) return;
    const timeMs = Math.round(performance.now() - started.current);
    recordAttemptAction({ puzzleId: puzzle.id, solved, usedHint: usedHint.current, timeMs })
      .then((r) => {
        if (r?.counted) setResult({ before: r.ratingBefore, after: r.ratingAfter });
      })
      .catch(() => {});
  }

  function onMove(input: BoardMove) {
    const g = game.current;
    if (!g || status !== "playing" || busy.current) return false;

    const before = g.fen;
    const r = g.tryMove(input);
    if (r.status === "illegal") return false;

    setMarks({});
    if (r.status === "wrong") {
      setStatus("wrong");
      setMarks({ [input.from]: "bad", [input.to]: "bad" });
      report(false);
      return false;
    }

    const preview = new Chess(before);
    const mine = preview.move(input);
    setFen(preview.fen());
    setLastMove(toLast(mine));
    setPlayed((p) => [...p, r.san]);

    if (r.status === "complete") {
      setStatus("solved");
      setMarks({ [input.to]: "good" });
      report(true);
      return true;
    }

    busy.current = true;
    later(() => {
      setFen(g.fen);
      if (r.reply) {
        setLastMove(toLast(r.reply));
        setPlayed((p) => [...p, r.reply!.san]);
      }
      busy.current = false;
    }, REPLY_DELAY);
    return true;
  }

  function hint() {
    const square = game.current?.hintSquare();
    if (!square) return;
    usedHint.current = true;
    setMarks({ [square]: "hint" });
  }

  function retry() {
    const g = game.current;
    if (!g) return;
    clearTimers();
    const opening = g.reset();
    setFen(g.fen);
    setLastMove(toLast(opening));
    setPlayed([opening.san]);
    setMarks({});
    setStatus("playing");
  }

  function reveal() {
    const g = game.current;
    if (!g) return;
    report(false);
    setStatus("revealed");
    setMarks({});
    const step = () => {
      if (g.isComplete) return;
      const m = g.advance();
      setFen(g.fen);
      setLastMove(toLast(m));
      setPlayed((p) => [...p, m.san]);
      later(step, 700);
    };
    step();
  }

  function next() {
    clearTimers();
    startTransition(async () => {
      const p = await nextPuzzleAction({ theme: theme || undefined, level: level || undefined });
      setEmpty(!p);
      if (p) onNext(p);
    });
  }

  // Sisi yang melangkah di FEN awal adalah lawan.
  const playerIsWhite = puzzle.fen.split(" ")[1] === "b";
  const finished = status === "solved" || status === "revealed";
  const turnText = playerIsWhite ? "Putih melangkah" : "Hitam melangkah";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="mx-auto w-full max-w-[560px]">
        <ChessBoard
          fen={fen}
          orientation={playerIsWhite ? "white" : "black"}
          interactive={status === "playing"}
          onMove={onMove}
          marks={marks}
          lastMove={lastMove}
          label={`Papan puzzle. ${turnText}.`}
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl">{heading}</h2>
            <Badge tone="forest">Rating {puzzle.rating}</Badge>
          </div>

          <div aria-live="polite" className="mt-3 min-h-14">
            {status === "loading" && <p className="text-muted">Lawan sedang melangkah…</p>}
            {status === "playing" && (
              <p className="flex items-center gap-2 font-semibold">
                <span
                  aria-hidden
                  className="size-4 rounded-full border border-ink"
                  style={{ background: playerIsWhite ? "#fff" : "#17211d" }}
                />
                {turnText}. Temukan langkah terbaik.
              </p>
            )}
            {status === "wrong" && (
              <p className="flex items-center gap-2 rounded-lg bg-danger-soft p-3 font-semibold text-danger">
                <X size={18} aria-hidden /> Bukan langkah itu. Coba lagi atau lihat solusi.
              </p>
            )}
            {status === "solved" && (
              <p className="flex items-center gap-2 rounded-lg bg-success-soft p-3 font-semibold text-success">
                <Check size={18} aria-hidden /> Puzzle selesai!
              </p>
            )}
            {status === "revealed" && <p className="font-semibold">Ini solusinya. Pelajari polanya.</p>}
          </div>

          {result && (
            <p className="mt-2 text-sm">
              Rating kamu: {result.before} → <strong>{result.after}</strong>
            </p>
          )}
          {!user && finished && (
            <p className="mt-2 text-sm text-muted">
              <Link href="/register" className="font-semibold text-forest underline">
                Buat akun
              </Link>{" "}
              agar rating dan riwayat puzzle tersimpan.
            </p>
          )}

          {finished && puzzle.themes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {puzzle.themes.slice(0, 6).map((t) => (
                <Badge key={t}>{themeLabel(t)}</Badge>
              ))}
            </div>
          )}

          {played.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              <span className="sr-only">Langkah: </span>
              {played.join(" ")}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {status === "wrong" || finished ? (
              <Button variant="secondary" onClick={retry}>
                <RotateCcw size={18} aria-hidden /> {finished ? "Mulai ulang" : "Coba lagi"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={hint} disabled={status !== "playing"}>
                <Lightbulb size={18} aria-hidden /> Petunjuk
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={reveal}
              disabled={status === "loading" || finished}
            >
              <Eye size={18} aria-hidden /> Lihat solusi
            </Button>
            <Button onClick={next} disabled={pending} className="col-span-2">
              {pending ? "Memuat…" : "Puzzle berikutnya"} <ArrowRight size={18} aria-hidden />
            </Button>
          </div>
          {empty && (
            <p role="alert" className="mt-2 text-sm text-danger">
              Tidak ada puzzle baru untuk filter ini. Coba ubah filter.
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <Field label="Tema" name="tema">
            <Select id="tema" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="">Semua tema</option>
              {PUZZLE_THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Kesulitan"
            name="kesulitan"
            help={user ? "Default menyesuaikan rating kamu ±200." : undefined}
          >
            <Select id="kesulitan" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">{user ? "Sesuai rating saya" : "Semua pemula–menengah"}</option>
              {PUZZLE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
          <Link href={`/puzzle/${puzzle.id}`} className={buttonClass("ghost", "sm", "w-full")}>
            Tautan puzzle ini
          </Link>
        </div>
      </div>
    </div>
  );
}
