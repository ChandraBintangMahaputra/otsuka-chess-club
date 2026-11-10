"use client";

import { useState } from "react";
import { Check, Crown, Trophy } from "lucide-react";
import { cn } from "@/components/ui";
import {
  championOf,
  createResolver,
  formatPoints,
  isByeMatch,
  standingsOf,
  winnerSide,
  type KnockoutSection,
  type KoMatch,
  type RoundRobinSection,
  type Section,
  type Tournament,
} from "@/lib/tournament";

const GOLD = "#e0b84a";

/** Strip papan catur seperti di poster. */
function Checker({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-4 w-full sm:h-5", className)}
      style={{
        backgroundImage:
          "conic-gradient(#17211d 25%, #f5efe2 0 50%, #17211d 0 75%, #f5efe2 0)",
        backgroundSize: "clamp(16px, 2.5vw, 20px) clamp(16px, 2.5vw, 20px)",
      }}
    />
  );
}

export function TournamentView({ t }: { t: Pick<Tournament, "title" | "subtitle" | "data"> }) {
  const players = t.data.sections.reduce(
    (acc, s) => {
      if (s.kind === "knockout") {
        const names = new Set<string>();
        for (const m of s.matches) for (const x of [m.a, m.b]) if (x.kind === "player" && x.name) names.add(x.name);
        acc.push(`${names.size} peserta`, `${s.matches.filter((m) => !isByeMatch(m)).length} laga gugur`);
      } else acc.push(`${s.players.length} peserta`, `${s.sessions.reduce((n, x) => n + x.games.length, 0)} laga`);
      return acc;
    },
    [] as string[],
  );

  return (
    <article>
      <header className="bg-ink text-[#f5efe2]">
        <Checker />
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            Otsuka Chess
          </p>
          <h1 className="mt-2 font-sans text-4xl font-extrabold tracking-tight sm:text-6xl">{t.title}</h1>
          {t.subtitle && <p className="mt-3 text-base opacity-90 sm:text-xl">{t.subtitle}</p>}
          {players.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {players.map((p, i) => (
                <li key={i} className="rounded-full border px-3 py-1 text-xs sm:text-sm" style={{ borderColor: GOLD, color: GOLD }}>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Checker />
      </header>

      {t.data.sections.map((s, i) => (
        <section key={i} className={cn("py-8 sm:py-12", i % 2 === 1 && "bg-[#efe7d6]")}>
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <SectionView section={s} />
          </div>
        </section>
      ))}

      {t.data.footnote && (
        <footer className="bg-ink text-[#f5efe2]">
          <p className="mx-auto w-full max-w-7xl px-4 py-4 text-sm sm:px-6">{t.data.footnote}</p>
          <Checker />
        </footer>
      )}
    </article>
  );
}

export function SectionView({ section }: { section: Section }) {
  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <h2 className="font-sans text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">{section.title}</h2>
        {section.note && <p className="text-sm text-muted sm:text-right">{section.note}</p>}
      </div>
      <div className="mt-5">
        {section.kind === "knockout" ? <Bracket section={section} /> : <RoundRobin section={section} />}
      </div>
    </>
  );
}

/* Bagan gugur */

function Bracket({ section }: { section: KnockoutSection }) {
  const resolver = createResolver(section.matches);
  const champion = championOf(section);
  const rounds = section.rounds.map((r, i) => ({
    ...r,
    matches: section.matches.filter((m) => m.round === i),
  }));
  // HP dan tablet: babak ditampilkan per tab, dimulai dari babak yang sedang berjalan.
  const current = Math.max(
    0,
    rounds.findIndex((r) => r.matches.some((m) => !isByeMatch(m) && !winnerSide(m))),
  );
  const [tab, setTab] = useState(current);
  const last = rounds.length - 1;

  return (
    <>
      {champion && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-ink p-4 text-[#f5efe2]">
          <Trophy size={28} style={{ color: GOLD }} aria-hidden />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Juara
            </p>
            <p className="text-xl font-extrabold">{champion}</p>
          </div>
        </div>
      )}

      <div className="lg:hidden">
        <div role="tablist" aria-label="Babak" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {rounds.map((r, i) => (
            <button
              key={i}
              role="tab"
              type="button"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-left",
                tab === i ? (i === last ? "text-ink" : "bg-ink text-[#f5efe2]") : "border border-line bg-surface text-ink",
              )}
              style={tab === i && i === last ? { background: GOLD } : undefined}
            >
              <span className="block text-sm font-extrabold uppercase">{r.name}</span>
              <span className="block text-[11px] opacity-80">{r.matches.filter((m) => !isByeMatch(m)).length} laga</span>
            </button>
          ))}
        </div>
        {rounds[tab] && (
          <div role="tabpanel" className="mt-3">
            <p className="mb-3 text-sm text-muted">{rounds[tab].detail}</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {rounds[tab].matches.map((m) => (
                <li key={m.id}>
                  <MatchCard match={m} resolver={resolver} final={tab === last} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div
        className="hidden gap-4 lg:grid"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, rounds.length)}, minmax(0, 1fr))` }}
      >
        {rounds.map((r, i) => (
          <div key={i} className="flex flex-col">
            <div
              className={cn("rounded-lg px-3 py-2", i === last ? "text-ink" : "bg-ink text-[#f5efe2]")}
              style={i === last ? { background: GOLD } : undefined}
            >
              <p className="font-extrabold uppercase">{r.name}</p>
              <p className="text-xs opacity-90">{r.detail}</p>
            </div>
            <ul className="mt-4 flex flex-1 flex-col justify-around gap-3">
              {r.matches.map((m) => (
                <li key={m.id}>
                  <MatchCard match={m} resolver={resolver} final={i === last} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function MatchCard({
  match,
  resolver,
  final,
}: {
  match: KoMatch;
  resolver: ReturnType<typeof createResolver>;
  final?: boolean;
}) {
  const win = winnerSide(match);
  const bye = isByeMatch(match);
  const decided = Boolean(win) && !bye;
  const row = (side: "a" | "b") => {
    const s = resolver.slot(match[side]);
    const score = side === "a" ? match.scoreA : match.scoreB;
    const won = decided && win === side;
    const lost = decided && win !== side;
    return (
      <div
        className={cn(
          "flex min-h-9 items-center justify-between gap-2 px-3 py-1.5 text-sm",
          side === "a" && "border-b border-line",
          s.bye && "bg-[#efe7d6]",
        )}
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-1.5",
            s.name ? "font-medium text-ink" : "text-muted",
            s.bye && "italic",
            won && "font-bold",
            lost && "text-muted line-through decoration-1",
          )}
        >
          {won && (final ? <Crown size={14} style={{ color: "#b8860b" }} aria-label="Menang" /> : <Check size={14} className="shrink-0 text-success" aria-label="Menang" />)}
          <span className="truncate">{s.name ?? s.placeholder}</span>
        </span>
        {score && <span className={cn("shrink-0 font-mono font-bold tabular-nums", lost && "text-muted")}>{score}</span>}
      </div>
    );
  };
  return (
    <div
      className={cn("flex overflow-hidden rounded-lg border-2 bg-surface", final ? "" : "border-ink")}
      style={final ? { borderColor: GOLD } : undefined}
    >
      <span
        className="grid w-12 shrink-0 place-items-center text-[11px] font-extrabold"
        style={{ background: final ? GOLD : "#e7dcc6" }}
      >
        {bye ? "BYE" : match.id}
      </span>
      <div className="min-w-0 flex-1">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/* Semua bertemu semua */

const RESULT_SCORE: Record<string, [string, string]> = { "1-0": ["1", "0"], "0-1": ["0", "1"], "1/2-1/2": ["½", "½"] };

function RoundRobin({ section }: { section: RoundRobinSection }) {
  const table = standingsOf(section);
  const anyPlayed = table.some((r) => r.played > 0);
  return (
    <div className="space-y-6">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {section.sessions.map((s, i) => (
          <li key={i} className="overflow-hidden rounded-lg border-2 border-ink bg-surface">
            <div className="flex items-center justify-between bg-ink px-3 py-2 text-sm font-extrabold uppercase text-[#f5efe2]">
              <span>{s.name}</span>
              {s.day && <span style={{ color: GOLD }}>{s.day}</span>}
            </div>
            <ul className="divide-y divide-line">
              {s.games.map((g, j) => {
                const [sw, sb] = g.result ? RESULT_SCORE[g.result] : ["", ""];
                return (
                  <li key={j} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5">
                    <span className={cn("truncate font-medium", g.result === "1-0" && "font-bold")}>{g.white || "—"}</span>
                    <span className="text-center font-mono text-sm tabular-nums text-muted">
                      {g.result ? (
                        <span className="font-bold text-ink">
                          {sw}–{sb}
                        </span>
                      ) : (
                        "vs"
                      )}
                    </span>
                    <span className={cn("truncate text-right font-medium", g.result === "0-1" && "font-bold")}>{g.black || "—"}</span>
                  </li>
                );
              })}
            </ul>
            {s.rest && <p className="border-t border-line bg-[#efe7d6] px-3 py-1.5 text-xs italic text-muted">Istirahat: {s.rest}</p>}
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto rounded-lg border-2 border-ink bg-surface">
        <table className="w-full text-left text-sm">
          <caption className="bg-ink px-3 py-2 text-left font-extrabold uppercase text-[#f5efe2]">Klasemen</caption>
          <thead className="bg-paper text-muted">
            <tr>
              <th className="p-2 pl-3 font-semibold">#</th>
              <th className="p-2 font-semibold">Pemain</th>
              <th className="p-2 text-center font-semibold" title="Main">Main</th>
              <th className="p-2 text-center font-semibold" title="Menang / Seri / Kalah">M-S-K</th>
              <th className="p-2 pr-3 text-right font-semibold">Poin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {table.map((r, i) => (
              <tr key={r.name}>
                <td className="p-2 pl-3 tabular-nums">{anyPlayed && i === 0 ? <Trophy size={16} style={{ color: "#b8860b" }} aria-label="Pertama" /> : i + 1}</td>
                <td className="p-2 font-semibold">{r.name}</td>
                <td className="p-2 text-center tabular-nums">{r.played}</td>
                <td className="p-2 text-center tabular-nums">
                  {r.win}-{r.draw}-{r.loss}
                </td>
                <td className="p-2 pr-3 text-right font-mono text-base font-bold tabular-nums">{formatPoints(r.points) || "0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
