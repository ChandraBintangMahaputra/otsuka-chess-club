"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Search, Swords, Trophy, Wifi, WifiOff, X } from "lucide-react";
import {
  cancelChallengeAction,
  createChallengeAction,
  getLobbyAction,
  respondChallengeAction,
  searchPlayersAction,
  type LobbyView,
} from "@/actions/play";
import { Badge, Button, buttonClass, Card, Field, Input, Select, cn } from "@/components/ui";
import { TIME_CONTROLS } from "@/lib/online-game";
import { topics, useChannel, usePolling, useRealtime, useTabActive } from "@/lib/realtime";
import { alertError, toastSuccess } from "@/lib/swal";

type OnlinePlayer = {
  id: string;
  fullName: string;
  username: string;
  department: string;
  rating: number;
  status: "idle" | "playing";
  gameId?: string;
};

function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return [now, setNow] as const;
}

export function Lobby({ initial }: { initial: LobbyView }) {
  const router = useRouter();
  const [lobby, setLobby] = useState(initial);
  const [offset, setOffset] = useState(() => initial.serverNow - Date.now());
  const [online, setOnline] = useState<OnlinePlayer[]>([]);
  const [tc, setTc] = useState<string>(TIME_CONTROLS[1].id);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OnlinePlayer[] | null>(null);
  const [pending, start] = useTransition();
  const active = useTabActive();
  const rt = useRealtime();
  const me = lobby.me;
  const [clientNow, setNow] = useNow(lobby.incoming.length + lobby.outgoing.length > 0);

  async function refresh() {
    try {
      const next = await getLobbyAction();
      setLobby(next);
      setOffset(next.serverNow - Date.now());
      // Jam hitung mundur berhenti saat tidak ada tantangan, jadi disegarkan di sini.
      setNow(Date.now());
      if (next.activeGameId && next.activeGameId !== lobby.activeGameId) router.push(`/main/${next.activeGameId}`);
    } catch {
      /* dicoba lagi pada sinyal atau polling berikutnya */
    }
  }

  const presence = useMemo(
    () => ({
      key: me.id,
      data: { id: me.id, fullName: me.fullName, username: me.username, department: me.department, rating: me.rating, status: "idle" },
    }),
    [me.id, me.fullName, me.username, me.department, me.rating],
  );

  const lobbyStatus = useChannel(topics.lobby, {
    enabled: active,
    presence,
    onPresence: (members) => setOnline(members as OnlinePlayer[]),
  });
  const userStatus = useChannel(topics.user(me.id), {
    enabled: active,
    events: ["challenge", "challenge-update"],
    onEvent: () => refresh(),
  });

  const live = lobbyStatus === "live" && userStatus === "live";
  // Tanpa realtime, tantangan masuk tetap terdeteksi lewat polling setiap 5 detik.
  usePolling(refresh, 5000, active && !live);

  const now = clientNow + offset;
  const others = online.filter((p) => p.id !== me.id).sort((a, b) => a.fullName.localeCompare(b.fullName));

  function challenge(target: { id: string; fullName: string }) {
    start(async () => {
      const r = await createChallengeAction(target.id, tc);
      if (!r.ok) return void alertError(r.error);
      await rt.notify(topics.user(target.id), "challenge");
      toastSuccess(`Tantangan dikirim ke ${target.fullName}`);
      await refresh();
    });
  }

  function respond(id: string, accept: boolean) {
    start(async () => {
      const r = await respondChallengeAction(id, accept);
      if (!r.ok) {
        await alertError(r.error);
        return refresh();
      }
      await rt.notify(topics.user(r.fromId), "challenge-update");
      if (r.gameId) router.push(`/main/${r.gameId}`);
      else refresh();
    });
  }

  function cancel(id: string, toId: string) {
    start(async () => {
      await cancelChallengeAction(id);
      await rt.notify(topics.user(toId), "challenge-update");
      refresh();
    });
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    start(async () => setResults((await searchPlayersAction(query)) as OnlinePlayer[]));
  }

  const busy = Boolean(lobby.activeGameId);
  const challengedIds = new Set(lobby.outgoing.map((c) => c.user.id));

  const playerRow = (p: OnlinePlayer, showStatus: boolean) => (
    <li key={p.id} className="flex items-center justify-between gap-3 p-3">
      <span className="min-w-0">
        <span className="block truncate font-semibold">{p.fullName}</span>
        <span className="block truncate text-sm text-muted">
          {p.rating} · {p.department || `@${p.username}`}
        </span>
      </span>
      {showStatus && p.status === "playing" ? (
        p.gameId ? (
          <Link href={`/main/${p.gameId}`} className={buttonClass("ghost", "sm")}>
            Sedang main · Tonton
          </Link>
        ) : (
          <Badge>Sedang main</Badge>
        )
      ) : (
        <Button
          size="sm"
          disabled={pending || busy || challengedIds.has(p.id)}
          onClick={() => challenge(p)}
        >
          <Swords size={16} aria-hidden /> {challengedIds.has(p.id) ? "Menunggu" : "Tantang"}
        </Button>
      )}
    </li>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        {busy && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-forest p-4 text-on-forest">
            <p className="font-semibold">Kamu sedang dalam permainan.</p>
            <Link href={`/main/${lobby.activeGameId}`} className={buttonClass("onDark", "sm")}>
              Lanjutkan permainan
            </Link>
          </div>
        )}

        <Card className="p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl">Pemain online</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted" aria-live="polite">
                {live ? (
                  <>
                    <Wifi size={16} className="text-success" aria-hidden /> Tersambung, {others.length} pemain lain online
                  </>
                ) : (
                  <>
                    <WifiOff size={16} aria-hidden />
                    {rt.configured
                      ? lobbyStatus === "error"
                        ? "Realtime tidak tersambung. Tantangan tetap berjalan lewat pengecekan berkala."
                        : "Menyambungkan…"
                      : "Daftar online belum aktif. Tantang pemain lewat pencarian di bawah."}
                  </>
                )}
              </p>
            </div>
            <div className="w-44">
              <Field label="Waktu" name="tc">
                <Select id="tc" value={tc} onChange={(e) => setTc(e.target.value)}>
                  {TIME_CONTROLS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          {others.length > 0 ? (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">{others.map((p) => playerRow(p, true))}</ul>
          ) : (
            live && <p className="mt-3 rounded-lg bg-paper p-4 text-sm text-muted">Belum ada pemain lain. Ajak rekanmu membuka halaman ini.</p>
          )}

          <form onSubmit={search} className="mt-4 flex gap-2" role="search">
            <label htmlFor="cari-pemain" className="sr-only">
              Cari anggota
            </label>
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3.5 text-muted" aria-hidden />
              <Input
                id="cari-pemain"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari anggota lain lewat nama atau username"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={pending || query.trim().length < 2}>
              Cari
            </Button>
          </form>
          {results && (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
              {results.length ? results.map((p) => playerRow(p, false)) : <li className="p-3 text-sm text-muted">Tidak ditemukan.</li>}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">Tantangan berlaku 60 detik dan hanya diterima jika lawan sedang membuka halaman Main.</p>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <p className="text-sm text-muted">Rating bermainmu</p>
          <p className="font-display text-4xl font-semibold">{me.rating}</p>
          <Link href="/peringkat" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-forest underline">
            <Trophy size={16} aria-hidden /> Lihat peringkat kantor
          </Link>
        </Card>

        <section aria-live="polite" className={cn("rounded-xl border p-4", lobby.incoming.length ? "border-copper bg-copper/5" : "border-line bg-surface")}>
          <h2 className="text-lg">Tantangan masuk</h2>
          {lobby.incoming.length === 0 && <p className="mt-1 text-sm text-muted">Belum ada.</p>}
          <ul className="mt-2 space-y-2">
            {lobby.incoming.map((c) => (
              <li key={c.id} className="rounded-lg bg-surface p-3">
                <p className="font-semibold">{c.user.fullName}</p>
                <p className="text-sm text-muted">
                  Rating {c.user.rating} · {c.timeControl} · {Math.max(0, Math.ceil((c.expiresAt - now) / 1000))} dtk
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button size="sm" disabled={pending || busy} onClick={() => respond(c.id, true)}>
                    <Check size={16} aria-hidden /> Terima
                  </Button>
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => respond(c.id, false)}>
                    <X size={16} aria-hidden /> Tolak
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {lobby.outgoing.length > 0 && (
          <Card className="p-4">
            <h2 className="text-lg">Tantangan terkirim</h2>
            <ul className="mt-2 space-y-2">
              {lobby.outgoing.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {c.user.fullName} · {c.timeControl} · {Math.max(0, Math.ceil((c.expiresAt - now) / 1000))} dtk
                  </span>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => cancel(c.id, c.user.id)}>
                    Batal
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-4">
          <h2 className="text-lg">Permainan terakhir</h2>
          {lobby.recent.length === 0 && <p className="mt-1 text-sm text-muted">Belum ada.</p>}
          <ul className="mt-2 divide-y divide-line">
            {lobby.recent.map((g) => (
              <li key={g.id}>
                <Link href={`/main/${g.id}`} className="flex items-center justify-between gap-2 py-2 text-sm hover:text-forest">
                  <span className="truncate">vs {g.opponent}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone={g.outcome === "menang" ? "success" : g.outcome === "kalah" ? "copper" : "neutral"}>
                      {g.outcome}
                    </Badge>
                    {g.delta !== null && <span className="tabular-nums">{g.delta > 0 ? `+${g.delta}` : g.delta}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  );
}
