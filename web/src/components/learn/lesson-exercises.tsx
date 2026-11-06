"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Check, RotateCcw, X } from "lucide-react";
import { completeLessonAction } from "@/actions/learning";
import { ChessBoard, type BoardMove } from "@/components/chess/chess-board";
import { useMe } from "@/components/site/me-provider";
import { Button } from "@/components/ui";
import { markGuestDone, markStarted } from "@/lib/guest-progress";
import { normalizeSan } from "@/lib/san";
import type { Exercise } from "@/lib/types";

type Feedback = { kind: "good" | "bad"; text: string } | null;

function ExerciseCard({
  exercise,
  index,
  onSolved,
}: {
  exercise: Exercise;
  index: number;
  onSolved: () => void;
}) {
  const [fen, setFen] = useState(exercise.fen);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string; san: string } | null>(null);
  const solved = feedback?.kind === "good";
  const orientation = useMemo(() => (new Chess(exercise.fen).turn() === "w" ? "white" : "black"), [exercise.fen]);

  function onMove(input: BoardMove) {
    const chess = new Chess(exercise.fen);
    const move = chess.move(input);
    const correct = exercise.answers.map(normalizeSan).includes(normalizeSan(move.san));

    if (!correct) {
      setFeedback({ kind: "bad", text: exercise.hint ?? "Belum tepat. Coba lagi." });
      return false;
    }
    setFen(chess.fen());
    setLastMove({ from: move.from, to: move.to, san: move.san });
    setFeedback({ kind: "good", text: exercise.explanation });
    onSolved();
    return true;
  }

  return (
    <section aria-label={`Latihan ${index + 1}`} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid gap-5 md:grid-cols-[minmax(0,20rem)_1fr]">
        <ChessBoard
          fen={fen}
          orientation={orientation}
          interactive={!solved}
          onMove={onMove}
          lastMove={lastMove}
          label={`Papan latihan ${index + 1}`}
        />
        <div>
          <p className="text-sm font-semibold text-copper">Latihan {index + 1}</p>
          <p className="mt-1 text-lg font-medium">{exercise.prompt}</p>
          <div aria-live="polite" className="mt-3">
            {feedback && (
              <p
                className={
                  feedback.kind === "good"
                    ? "flex gap-2 rounded-lg bg-success-soft p-3 text-success"
                    : "flex gap-2 rounded-lg bg-danger-soft p-3 text-danger"
                }
              >
                {feedback.kind === "good" ? (
                  <Check size={20} className="mt-0.5 shrink-0" aria-hidden />
                ) : (
                  <X size={20} className="mt-0.5 shrink-0" aria-hidden />
                )}
                <span>{feedback.text}</span>
              </p>
            )}
          </div>
          {solved && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setFen(exercise.fen);
                setLastMove(null);
                setFeedback(null);
              }}
            >
              <RotateCcw size={16} aria-hidden /> Ulangi
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function LessonExercises({ lessonId, exercises }: { lessonId: string; exercises: Exercise[] }) {
  const { user, completed } = useMe();
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const saved = useRef(false);
  const allDone = solved.size === exercises.length;

  useEffect(() => markStarted(lessonId), [lessonId]);

  useEffect(() => {
    if (!allDone || saved.current) return;
    saved.current = true;
    // BD-06: selesai bila semua latihan benar.
    if (user) completeLessonAction(lessonId).catch(() => {});
    else markGuestDone(lessonId);
  }, [allDone, user, lessonId]);

  return (
    <div className="space-y-4">
      {exercises.map((ex, i) => (
        <ExerciseCard
          key={ex.fen + i}
          exercise={ex}
          index={i}
          onSolved={() => setSolved((s) => new Set(s).add(i))}
        />
      ))}
      <p aria-live="polite" className="text-sm font-semibold text-muted">
        {allDone || completed.has(lessonId)
          ? user
            ? "Materi selesai dan tersimpan di profilmu."
            : "Materi selesai. Buat akun agar progres tersimpan."
          : `${solved.size} dari ${exercises.length} latihan benar`}
      </p>
    </div>
  );
}
