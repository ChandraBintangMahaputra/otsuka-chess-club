"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import { Flag, Handshake, RotateCcw, X } from "lucide-react";
import {
  abortAction,
  claimTimeoutAction,
  createChallengeAction,
  getGameAction,
  offerDrawAction,
  playMoveAction,
  resignAction,
  respondDrawAction,
} from "@/actions/play";
import { ChessBoard, type BoardMove } from "@/components/chess/chess-board";
import { Button, buttonClass, cn } from "@/components/ui";
import { TERMINATION_LABEL, TIME_CONTROLS, opposite, resultFor, timeControlLabel, turnOf, type Color } from "@/lib/online-game";
import type { GameView, PlayerView } from "@/lib/play-types";
import { topics, useChannel, usePolling, useRealtime, useTabActive } from "@/lib/realtime";
import { alertError, confirmAction, toastSuccess } from "@/lib/swal";

type Snapshot = { view: GameView; receivedAt: number };

function format(ms: number) {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  if (total < 10_000) return `${s}.${Math.floor((total % 1000) / 100)}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function remaining(snap: Snapshot, color: Color, now: number) {
  const { view } = snap;
  const base = view.clocks[color];
  const running = view.clockRunning && turnOf(view.moves.length) === color;
  return running ? base - Math.max(0, now - snap.receivedAt) : base;
}

function PlayerBar({
  player,
  color,
  ms,
  active,
  isMe,
}: {
  player: PlayerView;
  color: Color;
  ms: number;
  active: boolean;
  isMe: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-2.5 py-1.5 sm:px-3 sm:py-2">
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden className="size-3.5 shrink-0 rounded-full border border-ink" style={{ background: color === "w" ? "#fff" : "#17211d" }} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold sm:text-base">
            {player.fullName}
            {isMe && <span className="font-normal text-muted"> (kamu)</span>}
          </span>
          <span className="block text-xs text-muted">{player.rating}</span>
        </span>
      </span>
      <span
        role="timer"
        aria-label={`Sisa waktu ${player.fullName}`}
        className={cn(
          "shrink-0 rounded-md px-2.5 py-0.5 font-mono text-lg font-semibold tabular-nums sm:px-3 sm:py-1 sm:text-xl",
          active ? (ms < 20_000 ? "bg-danger text-white" : "bg-forest text-on-forest") : "bg-line/60 text-ink",
        )}
      >
        {format(ms)}
      </span>
    </div>
  );
}

export function OnlineGame({ initial }: { initial: GameView }) {
  const router = useRouter();
  const [snap, setSnap] = useState<Snapshot>(() => ({ view: initial, receivedAt: Date.now() }));
  const [optimistic, setOptimistic] = useState<{ fen: string; lastMove: GameView["lastMove"] } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pending, start] = useTransition();
  const claimed = useRef(-1);
  const tabActive = useTabActive();
  const rt = useRealtime();

  const view = snap.view;
  const me = view.myColor;
  const ply = view.moves.length;
  const turn = turnOf(ply);
  const isActive = view.status === "active";
  const orientation: Color = me ?? "w";

  function apply(next: GameView | null | undefined) {
    if (next) {
      const at = Date.now();
      setSnap({ view: next, receivedAt: at });
      // Penanda "sekarang" ikut disegarkan, kalau tidak sisa jam bisa terlihat bertambah.
      setNow(at);
    }
    setOptimistic(null);
  }

  async function refresh() {
    const r = await getGameAction(view.id).catch(() => null);
    if (r?.game) apply(r.game);
  }

  const status = useChannel(topics.game(view.id), {
    enabled: tabActive && isActive,
    events: ["sync"],
    onEvent: () => refresh(),
  });

  // Penonton dan pemain tercatat "sedang main" di lobi, satu pembaruan status per halaman.
  const lobbyPresence = useMemo(() => {
    const self = me === "w" ? view.white : me === "b" ? view.black : null;
    return self
      ? { key: self.id, data: { ...self, status: "playing", gameId: view.id } }
      : undefined;
  }, [me, view.white, view.black, view.id]);
  useChannel(lobbyPresence ? topics.lobby : null, { enabled: tabActive && isActive, presence: lobbyPresence });

  // Halaman dibuka dari lobi yang mungkin sudah di-scroll. Di HP papan harus langsung terlihat penuh.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Cadangan tanpa realtime: periksa tiap 3 detik. Dengan realtime, cukup sesekali untuk berjaga.
  usePolling(refresh, status === "live" ? 20_000 : 3_000, tabActive && isActive);

  useEffect(() => {
    if (!isActive || !view.clockRunning) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [isActive, view.clockRunning]);

  const clocks = { w: remaining(snap, "w", now), b: remaining(snap, "b", now) };

  // Jam di layar habis: minta server memutuskan, satu kali per posisi.
  useEffect(() => {
    if (!isActive || !view.clockRunning || clocks[turn] > 0 || claimed.current === ply) return;
    claimed.current = ply;
    claimTimeoutAction(view.id).then((r) => {
      if (r.game) {
        apply(r.game);
        if (r.game.status !== "active") rt.notify(topics.game(view.id), "sync");
      }
    });
  });

  function afterAction(r: { ok: boolean; error?: string; game?: GameView | null }) {
    apply(r.game);
    if (!r.ok && r.error) alertError(r.error);
    rt.notify(topics.game(view.id), "sync");
  }

  function onMove(move: BoardMove) {
    if (!me || !isActive || turn !== me || pending) return false;
    const chess = new Chess(view.fen);
    let played;
    try {
      played = chess.move(move);
    } catch {
      return false;
    }
    const uci = played.from + played.to + (played.promotion ?? "");
    setOptimistic({ fen: chess.fen(), lastMove: { from: played.from, to: played.to, san: played.san } });
    start(async () => {
      const r = await playMoveAction(view.id, uci, ply);
      afterAction(r);
    });
    return true;
  }

  async function act(
    title: string,
    text: string,
    confirmText: string,
    run: (id: string) => Promise<{ ok: boolean; error?: string; game?: GameView | null }>,
  ) {
    if (title && !(await confirmAction(title, text, confirmText))) return;
    start(async () => afterAction(await run(view.id)));
  }

  function rematch() {
    const opponent = me === "w" ? view.black : view.white;
    const tc = TIME_CONTROLS.find((t) => t.initial * 1000 === view.initialMs && t.increment * 1000 === view.incrementMs);
    start(async () => {
      const r = await createChallengeAction(opponent.id, tc?.id ?? TIME_CONTROLS[1].id);
      if (!r.ok) return void alertError(r.error);
      await rt.notify(topics.user(opponent.id), "challenge");
      toastSuccess(`Tantangan dikirim ke ${opponent.fullName}`);
      router.push("/main");
    });
  }

  const top = orientation === "w" ? "b" : "w";
  const bottom = orientation;
  const player = (c: Color) => (c === "w" ? view.white : view.black);
  const myTurn = isActive && me === turn;
  const theyOfferDraw = me && view.drawOffer === opposite(me);
  const iOfferDraw = me && view.drawOffer === me;

  let statusText = "";
  if (view.status === "aborted") statusText = "Permainan dibatalkan.";
  else if (view.status === "finished" && view.result && view.termination) {
    const reason = TERMINATION_LABEL[view.termination];
    statusText =
      view.result === "1/2-1/2"
        ? `Remis (${reason}).`
        : `${view.result === "1-0" ? view.white.fullName : view.black.fullName} menang (${reason}).`;
  } else if (!view.clockRunning) statusText = ply === 0 ? "Putih melangkah dulu. Jam mulai setelah Hitam melangkah." : "Hitam melangkah. Jam mulai setelah langkah ini.";
  else statusText = myTurn ? "Giliranmu." : me ? "Menunggu lawan…" : `Giliran ${turn === "w" ? "Putih" : "Hitam"}.`;

  const pairs = [];
  for (let i = 0; i < view.sanMoves.length; i += 2) pairs.push({ no: i / 2 + 1, w: view.sanMoves[i], b: view.sanMoves[i + 1] });

  return (
    <div className="grid gap-3 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      {/* Lebar papan dibatasi tinggi layar agar papan, kedua jam, dan status muat tanpa scroll di HP. */}
      <div className="mx-auto w-full max-w-[max(17rem,min(560px,calc(100dvh-20rem)))] space-y-1.5 sm:space-y-2 lg:max-w-[max(20rem,min(560px,calc(100dvh-12rem)))]">
        <PlayerBar player={player(top)} color={top} ms={clocks[top]} active={isActive && turn === top} isMe={me === top} />
        <ChessBoard
          fen={optimistic?.fen ?? view.fen}
          orientation={orientation === "w" ? "white" : "black"}
          interactive={myTurn && !pending && !optimistic}
          onMove={onMove}
          lastMove={optimistic?.lastMove ?? view.lastMove}
          label={`Papan permainan online. ${statusText}`}
        />
        <PlayerBar player={player(bottom)} color={bottom} ms={clocks[bottom]} active={isActive && turn === bottom} isMe={me === bottom} />
      </div>

      <div className="mx-auto w-full max-w-[560px] space-y-3 sm:space-y-4 lg:max-w-none">
        <div className="rounded-xl border border-line bg-surface p-3 sm:p-4">
          <p className="text-sm text-muted">
            {timeControlLabel(view.initialMs, view.incrementMs)} · {status === "live" ? "realtime" : "pengecekan berkala"}
          </p>
          <p aria-live="polite" className="mt-1 font-semibold">
            {statusText}
          </p>
          {view.ratingChange && me && view.result && (
            <p className="mt-2 text-sm">
              Kamu {resultFor(view.result, me)}. Rating {player(me).rating - view.ratingChange[me]} →{" "}
              <strong>{player(me).rating}</strong> ({view.ratingChange[me] > 0 ? "+" : ""}
              {view.ratingChange[me]})
            </p>
          )}

          {theyOfferDraw && isActive && (
            <div className="mt-3 rounded-lg bg-copper/10 p-3">
              <p className="text-sm font-semibold">Lawan menawarkan remis.</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" disabled={pending} onClick={() => act("", "", "", (id) => respondDrawAction(id, true))}>
                  Terima
                </Button>
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => act("", "", "", (id) => respondDrawAction(id, false))}>
                  Tolak
                </Button>
              </div>
            </div>
          )}

          {me && isActive && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {ply < 2 ? (
                <Button variant="secondary" disabled={pending} onClick={() => act("Batalkan permainan?", "Rating tidak berubah.", "Ya, batalkan", abortAction)}>
                  <X size={18} aria-hidden /> Batalkan
                </Button>
              ) : (
                <Button variant="secondary" disabled={pending} onClick={() => act("Menyerah?", "Kamu akan dinyatakan kalah.", "Ya, menyerah", resignAction)}>
                  <Flag size={18} aria-hidden /> Menyerah
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={pending || ply < 2 || Boolean(iOfferDraw)}
                onClick={() => act("Tawarkan remis?", "Lawan bisa menerima atau menolak.", "Ya, tawarkan", offerDrawAction)}
              >
                <Handshake size={18} aria-hidden /> {iOfferDraw ? "Menunggu…" : "Tawarkan remis"}
              </Button>
            </div>
          )}

          {!isActive && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/main" className={buttonClass("secondary")}>
                Ke lobi
              </Link>
              {me && (
                <Button disabled={pending} onClick={rematch}>
                  <RotateCcw size={18} aria-hidden /> Tantang lagi
                </Button>
              )}
            </div>
          )}
        </div>

        <ol className="grid max-h-48 grid-cols-[2.5rem_1fr_1fr] sm:max-h-72 gap-x-1 overflow-y-auto rounded-xl border border-line bg-surface p-2 text-[15px]">
          {pairs.length === 0 && <li className="col-span-3 p-2 text-sm text-muted">Belum ada langkah.</li>}
          {pairs.map((p) => (
            <li key={p.no} className="col-span-3 grid grid-cols-subgrid items-center py-0.5">
              <span className="pl-1 text-sm text-muted">{p.no}.</span>
              <span className="px-2 font-medium">{p.w}</span>
              <span className="px-2 font-medium">{p.b ?? ""}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
