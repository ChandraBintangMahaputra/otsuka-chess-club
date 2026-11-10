"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Shuffle, Trash2, Trophy, Wand2 } from "lucide-react";
import {
  createTournamentAction,
  deleteTournamentAction,
  saveTournamentAction,
} from "@/actions/admin-tournament";
import { ConfirmDeleteButton } from "@/components/admin/forms";
import { Button, buttonClass, cn, Field, Input, Select } from "@/components/ui";
import { SectionView } from "@/components/tournament/tournament-view";
import { alertError, confirmAction, toastSuccess } from "@/lib/swal";
import {
  createResolver,
  emptyKnockout,
  emptyRoundRobin,
  generateKnockout,
  generateRoundRobin,
  isByeMatch,
  renumber,
  winnerSide,
  type KnockoutSection,
  type KoMatch,
  type RoundRobinSection,
  type RrResult,
  type Section,
  type Side,
  type Slot,
  type Tournament,
  type TournamentData,
} from "@/lib/tournament";

export function CreateTournamentButtons() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const create = (template: "poster" | "kosong") =>
    start(async () => {
      try {
        router.push(`/admin/turnamen/${await createTournamentAction(template)}`);
      } catch {
        alertError("Gagal membuat turnamen.");
      }
    });
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => create("kosong")}>
        <Plus size={16} aria-hidden /> Turnamen kosong
      </Button>
      <Button size="sm" disabled={pending} onClick={() => create("poster")}>
        <Wand2 size={16} aria-hidden /> Dari bagan poster
      </Button>
    </div>
  );
}

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "1", "1½", "1.5", "2,5" menjadi angka; selain itu null. */
function scoreValue(s: string) {
  const t = s.trim().replace(",", ".").replace("½", ".5");
  if (!t) return null;
  const n = Number(t.startsWith(".") ? `0${t}` : t);
  return Number.isFinite(n) ? n : null;
}

export function TournamentEditor({ initial }: { initial: Tournament }) {
  const router = useRouter();
  const [meta, setMeta] = useState({
    title: initial.title,
    slug: initial.slug,
    subtitle: initial.subtitle,
    isPublished: initial.isPublished,
  });
  const [data, setData] = useState<TournamentData>(initial.data);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<number | "info">(initial.data.sections.length ? 0 : "info");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (fn: (d: TournamentData) => void) => {
    setData((d) => {
      const next = structuredClone(d);
      fn(next);
      return next;
    });
    setDirty(true);
  };
  const editMeta = (patch: Partial<typeof meta>) => {
    setMeta((m) => ({ ...m, ...patch }));
    setDirty(true);
  };

  function save() {
    start(async () => {
      try {
        const r = await saveTournamentAction({ id: initial.id, ...meta, data });
        if (!r.ok) return void alertError(r.error);
        setDirty(false);
        toastSuccess("Turnamen tersimpan.");
        router.refresh();
      } catch {
        alertError("Gagal menyimpan. Coba lagi.");
      }
    });
  }

  const tabs: { key: number | "info"; label: string }[] = [
    { key: "info", label: "Info" },
    ...data.sections.map((s, i) => ({ key: i, label: s.title || `Bagian ${i + 1}` })),
  ];
  const section = typeof tab === "number" ? data.sections[tab] : null;

  return (
    <div className="pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/turnamen" className="text-sm font-semibold text-forest underline">
            ← Semua turnamen
          </Link>
          <h1 className="mt-1 truncate text-2xl sm:text-3xl">{meta.title || "Turnamen"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {initial.isPublished && (
            <Link href={`/turnamen/${initial.slug}`} target="_blank" className={buttonClass("secondary", "sm")}>
              <ExternalLink size={16} aria-hidden /> Halaman publik
            </Link>
          )}
          <ConfirmDeleteButton
            onDelete={() => deleteTournamentAction(initial.id)}
            redirectTo="/admin/turnamen"
            text="Turnamen beserta seluruh bagan dan skornya akan dihapus."
          />
        </div>
      </div>

      <div role="tablist" aria-label="Bagian turnamen" className="-mx-4 mt-5 flex gap-1 overflow-x-auto border-b [scrollbar-width:none] border-line px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-sm font-semibold",
              tab === t.key ? "border-forest text-forest" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "info" && (
          <InfoPanel
            meta={meta}
            editMeta={editMeta}
            data={data}
            edit={edit}
            onAdded={(i) => setTab(i)}
          />
        )}
        {section && typeof tab === "number" && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Judul bagian" name="sec-title">
                <Input id="sec-title" value={section.title} onChange={(e) => edit((d) => void (d.sections[tab].title = e.target.value))} />
              </Field>
              <Field label="Catatan" name="sec-note">
                <Input id="sec-note" value={section.note} onChange={(e) => edit((d) => void (d.sections[tab].note = e.target.value))} />
              </Field>
            </div>
            {section.kind === "knockout" ? (
              <KnockoutEditor
                section={section}
                edit={(fn) => edit((d) => fn(d.sections[tab] as KnockoutSection))}
                replace={(s) => edit((d) => void (d.sections[tab] = s))}
              />
            ) : (
              <RoundRobinEditor section={section} edit={(fn) => edit((d) => fn(d.sections[tab] as RoundRobinSection))} />
            )}
            <details className="rounded-xl border border-line bg-surface">
              <summary className="min-h-11 px-4 py-3 font-semibold">Pratinjau tampilan publik</summary>
              <div className="border-t border-line bg-paper p-4">
                <SectionView section={section} />
              </div>
            </details>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={async () => {
                  if (!(await confirmAction("Hapus bagian ini?", section.title, "Ya, hapus"))) return;
                  edit((d) => void d.sections.splice(tab, 1));
                  setTab("info");
                }}
              >
                <Trash2 size={16} aria-hidden /> Hapus bagian ini
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tombol simpan selalu terlihat, di HP berada di atas menu bawah. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 mt-6 lg:bottom-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur">
          <p className="text-sm text-muted" aria-live="polite">
            {dirty ? "Ada perubahan yang belum disimpan." : "Semua perubahan tersimpan."}
          </p>
          <Button disabled={pending || !dirty} onClick={save}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoPanel({
  meta,
  editMeta,
  data,
  edit,
  onAdded,
}: {
  meta: { title: string; slug: string; subtitle: string; isPublished: boolean };
  editMeta: (p: Partial<typeof meta>) => void;
  data: TournamentData;
  edit: (fn: (d: TournamentData) => void) => void;
  onAdded: (index: number) => void;
}) {
  const add = (s: Section) => {
    edit((d) => void d.sections.push(s));
    onAdded(data.sections.length);
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul" name="t-title">
          <Input id="t-title" value={meta.title} onChange={(e) => editMeta({ title: e.target.value })} />
        </Field>
        <Field label="Slug" name="t-slug" help={`Alamat publik: /turnamen/${meta.slug}`}>
          <Input id="t-slug" value={meta.slug} onChange={(e) => editMeta({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
        </Field>
      </div>
      <Field label="Subjudul" name="t-sub">
        <Input id="t-sub" value={meta.subtitle} onChange={(e) => editMeta({ subtitle: e.target.value })} />
      </Field>
      <Field label="Catatan kaki" name="t-foot">
        <Input id="t-foot" value={data.footnote} onChange={(e) => edit((d) => void (d.footnote = e.target.value))} />
      </Field>
      <label className="flex min-h-11 items-center gap-2 font-semibold">
        <input
          type="checkbox"
          checked={meta.isPublished}
          onChange={(e) => editMeta({ isPublished: e.target.checked })}
          className="size-5 accent-[var(--forest)]"
        />
        Terbitkan di halaman publik /turnamen
      </label>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="font-semibold">Tambah bagian</p>
        <p className="text-sm text-muted">Mis. bagan putra dengan sistem gugur dan grup putri semua bertemu semua.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => add(emptyKnockout())}>
            <Plus size={16} aria-hidden /> Sistem gugur
          </Button>
          <Button size="sm" variant="secondary" onClick={() => add(emptyRoundRobin())}>
            <Plus size={16} aria-hidden /> Semua bertemu semua
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Sistem gugur */

function KnockoutEditor({
  section,
  edit,
  replace,
}: {
  section: KnockoutSection;
  edit: (fn: (s: KnockoutSection) => void) => void;
  replace: (s: KnockoutSection) => void;
}) {
  const resolver = createResolver(section.matches);
  const players = useMemo(() => {
    const names: string[] = [];
    for (const m of section.matches) for (const s of [m.a, m.b]) if (s.kind === "player" && s.name && !names.includes(s.name)) names.push(s.name);
    return names;
  }, [section.matches]);
  const listId = `pemain-${section.title.replace(/\W/g, "")}`;

  return (
    <div className="space-y-6">
      <Generator section={section} players={players} replace={replace} />

      {section.rounds.map((r, ri) => {
        const matches = section.matches.filter((m) => m.round === ri);
        return (
          <section key={ri} className="rounded-xl border border-line bg-surface">
            <div className="grid gap-2 border-b border-line bg-paper p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <Field label={`Babak ${ri + 1}`} name={`r-${ri}`}>
                <Input id={`r-${ri}`} value={r.name} onChange={(e) => edit((s) => void (s.rounds[ri].name = e.target.value))} />
              </Field>
              <Field label="Keterangan" name={`rd-${ri}`}>
                <Input id={`rd-${ri}`} value={r.detail} onChange={(e) => edit((s) => void (s.rounds[ri].detail = e.target.value))} />
              </Field>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Hapus babak ${r.name}`}
                disabled={matches.length > 0}
                title={matches.length ? "Kosongkan laga di babak ini dulu" : undefined}
                onClick={() =>
                  edit((s) => {
                    s.rounds.splice(ri, 1);
                    for (const m of s.matches) if (m.round > ri) m.round--;
                  })
                }
              >
                <Trash2 size={16} aria-hidden />
              </Button>
            </div>
            <ul className="divide-y divide-line">
              {matches.map((m, mi) => (
                <MatchEditor
                  key={m.id}
                  match={m}
                  section={section}
                  resolver={resolver}
                  listId={listId}
                  first={mi === 0}
                  last={mi === matches.length - 1}
                  edit={(fn) => edit((s) => fn(s.matches.find((x) => x.id === m.id)!))}
                  move={(dir) =>
                    edit((s) => {
                      const same = s.matches.filter((x) => x.round === ri);
                      const other = same[mi + dir];
                      const i = s.matches.findIndex((x) => x.id === m.id);
                      const j = s.matches.findIndex((x) => x.id === other.id);
                      [s.matches[i], s.matches[j]] = [s.matches[j], s.matches[i]];
                    })
                  }
                  remove={async () => {
                    const used = section.matches.some((x) => [x.a, x.b].some((sl) => sl.kind === "winner" && sl.match === m.id));
                    if (!(await confirmAction(`Hapus laga ${m.id}?`, used ? "Laga lain yang merujuk pemenangnya akan diubah menjadi BYE." : "", "Ya, hapus"))) return;
                    edit((s) => {
                      s.matches = s.matches.filter((x) => x.id !== m.id);
                      for (const x of s.matches)
                        for (const side of ["a", "b"] as const) {
                          const sl = x[side];
                          if (sl.kind === "winner" && sl.match === m.id) x[side] = { kind: "bye" };
                        }
                    });
                  }}
                />
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 border-t border-line p-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  edit((s) => {
                    let n = s.matches.length + 1;
                    while (s.matches.some((x) => x.id === `M${n}`)) n++;
                    s.matches.push({ id: `M${n}`, round: ri, a: { kind: "player", name: "" }, b: { kind: "player", name: "" }, scoreA: "", scoreB: "", winner: null });
                  })
                }
              >
                <Plus size={16} aria-hidden /> Tambah laga
              </Button>
            </div>
          </section>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => edit((s) => void s.rounds.push({ name: `Babak ${s.rounds.length + 1}`, detail: "" }))}>
          <Plus size={16} aria-hidden /> Tambah babak
        </Button>
        <Button size="sm" variant="secondary" onClick={() => replace(renumber(section))}>
          Nomori ulang laga (M1, M2, …)
        </Button>
      </div>

      <datalist id={listId}>
        {players.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </div>
  );
}

function Generator({
  section,
  players,
  replace,
}: {
  section: KnockoutSection;
  players: string[];
  replace: (s: KnockoutSection) => void;
}) {
  const [text, setText] = useState(players.join("\n"));
  const [random, setRandom] = useState(false);
  const names = text.split("\n").map((s) => s.trim()).filter(Boolean);

  async function run() {
    if (names.length < 2) return void alertError("Isi minimal dua peserta.");
    if (!(await confirmAction("Buat ulang bagan?", "Semua laga, skor, dan pemenang di bagian ini diganti.", "Ya, buat ulang"))) return;
    const order = random ? shuffle(names) : names;
    // Nama babak lama dipakai lagi bila jumlah babaknya tetap sama.
    const probe = generateKnockout(order);
    const g = probe.rounds.length === section.rounds.length ? generateKnockout(order, section.rounds) : probe;
    replace({ ...section, ...g });
  }

  return (
    <details className="rounded-xl border border-line bg-surface">
      <summary className="min-h-11 px-4 py-3 font-semibold">Buat ulang bagan dari daftar peserta</summary>
      <div className="space-y-3 border-t border-line p-4">
        <p className="text-sm text-muted">
          Satu nama per baris. Peserta dipasangkan berurutan (1 vs 2, 3 vs 4, …). Bila ganjil, peserta terakhir mendapat BYE dan tampil paling atas di babak berikutnya.
        </p>
        <textarea
          aria-label="Daftar peserta"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/25"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={random} onChange={(e) => setRandom(e.target.checked)} className="size-5 accent-[var(--forest)]" />
            <Shuffle size={16} aria-hidden /> Acak urutan (undian)
          </label>
          <Button size="sm" onClick={run}>
            Buat bagan · {names.length} peserta
          </Button>
        </div>
      </div>
    </details>
  );
}

function MatchEditor({
  match,
  section,
  resolver,
  listId,
  first,
  last,
  edit,
  move,
  remove,
}: {
  match: KoMatch;
  section: KnockoutSection;
  resolver: ReturnType<typeof createResolver>;
  listId: string;
  first: boolean;
  last: boolean;
  edit: (fn: (m: KoMatch) => void) => void;
  move: (dir: -1 | 1) => void;
  remove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const bye = isByeMatch(match);
  const win = winnerSide(match);
  const sources = section.matches.filter((m) => m.id !== match.id && m.round < match.round);

  function setScore(side: Side, value: string) {
    edit((m) => {
      if (side === "a") m.scoreA = value;
      else m.scoreB = value;
      // Skor angka yang berbeda langsung menentukan pemenang, tetap bisa diubah manual.
      const a = scoreValue(m.scoreA);
      const b = scoreValue(m.scoreB);
      if (a !== null && b !== null && a !== b) m.winner = a > b ? "a" : "b";
    });
  }

  const sideRow = (side: Side) => {
    const r = resolver.slot(match[side]);
    const isWinner = win === side;
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={bye || r.bye}
          onClick={() => edit((m) => void (m.winner = m.winner === side ? null : side))}
          aria-pressed={isWinner}
          aria-label={`Tandai ${r.name ?? r.placeholder} menang`}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-lg border transition-colors",
            isWinner ? "border-success bg-success text-white" : "border-line text-muted hover:border-forest",
            (bye || r.bye) && "opacity-40",
          )}
        >
          <Trophy size={18} aria-hidden />
        </button>
        <span className={cn("min-w-0 flex-1 truncate", r.name ? "font-medium" : "italic text-muted", isWinner && "font-bold")}>
          {r.name ?? r.placeholder}
        </span>
        {!bye && (
          <div className="w-16 shrink-0 sm:w-20">
          <Input
            aria-label={`Skor ${r.name ?? r.placeholder}`}
            value={side === "a" ? match.scoreA : match.scoreB}
            onChange={(e) => setScore(side, e.target.value)}
            placeholder="Skor"
            inputMode="decimal"
            className="px-1 text-center font-mono"
          />
          </div>
        )}
      </div>
    );
  };

  return (
    <li className="p-3">
      <div className="flex items-start gap-3">
        <span className="mt-2.5 w-12 shrink-0 rounded-md bg-line/60 py-1 text-center text-xs font-extrabold">{bye ? "BYE" : match.id}</span>
        <div className="min-w-0 flex-1 space-y-2">
          {sideRow("a")}
          {sideRow("b")}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Pencil size={16} aria-hidden /> {open ? "Tutup" : "Ubah pertemuan"}
        </Button>
        <Button variant="ghost" size="sm" disabled={first} onClick={() => move(-1)} aria-label="Naikkan">
          <ArrowUp size={16} aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" disabled={last} onClick={() => move(1)} aria-label="Turunkan">
          <ArrowDown size={16} aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={remove} aria-label={`Hapus laga ${match.id}`} className="text-danger">
          <Trash2 size={16} aria-hidden />
        </Button>
      </div>
      {open && (
        <div className="mt-2 grid gap-3 rounded-lg bg-paper p-3 sm:grid-cols-2">
          {(["a", "b"] as const).map((side) => (
            <SlotEditor
              key={side}
              label={side === "a" ? "Sisi atas" : "Sisi bawah"}
              slot={match[side]}
              sources={sources}
              listId={listId}
              onChange={(slot) => edit((m) => void (m[side] = slot))}
            />
          ))}
        </div>
      )}
    </li>
  );
}

function SlotEditor({
  label,
  slot,
  sources,
  listId,
  onChange,
}: {
  label: string;
  slot: Slot;
  sources: KoMatch[];
  listId: string;
  onChange: (s: Slot) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <Select
        aria-label={`Jenis ${label}`}
        value={slot.kind}
        onChange={(e) => {
          const kind = e.target.value as Slot["kind"];
          if (kind === "player") onChange({ kind, name: "" });
          else if (kind === "winner") onChange({ kind, match: sources[sources.length - 1]?.id ?? "" });
          else onChange({ kind });
        }}
      >
        <option value="player">Nama pemain</option>
        <option value="winner" disabled={!sources.length}>
          Pemenang laga lain
        </option>
        <option value="bye">BYE (lolos otomatis)</option>
      </Select>
      {slot.kind === "player" && (
        <Input aria-label={`Nama ${label}`} list={listId} value={slot.name} placeholder="Nama pemain" onChange={(e) => onChange({ kind: "player", name: e.target.value })} />
      )}
      {slot.kind === "winner" && (
        <Select aria-label={`Laga asal ${label}`} value={slot.match} onChange={(e) => onChange({ kind: "winner", match: e.target.value })}>
          {sources.map((m) => (
            <option key={m.id} value={m.id}>
              Pemenang {m.id}
              {isByeMatch(m) ? " (BYE)" : ""}
            </option>
          ))}
        </Select>
      )}
    </fieldset>
  );
}

/* Semua bertemu semua */

const RESULTS: { value: string; label: string }[] = [
  { value: "", label: "vs" },
  { value: "1-0", label: "1–0" },
  { value: "1/2-1/2", label: "½–½" },
  { value: "0-1", label: "0–1" },
];

function RoundRobinEditor({
  section,
  edit,
}: {
  section: RoundRobinSection;
  edit: (fn: (s: RoundRobinSection) => void) => void;
}) {
  const [day, setDay] = useState(section.sessions[0]?.day ?? "");

  function rename(i: number, next: string) {
    edit((s) => {
      const old = s.players[i];
      s.players[i] = next;
      for (const ses of s.sessions) {
        if (ses.rest === old) ses.rest = next;
        for (const g of ses.games) {
          if (g.white === old) g.white = next;
          if (g.black === old) g.black = next;
        }
      }
    });
  }

  async function regenerate() {
    const names = section.players.map((p) => p.trim()).filter(Boolean);
    if (names.length < 2) return void alertError("Isi minimal dua peserta.");
    if (!(await confirmAction("Buat ulang jadwal?", "Semua sesi dan hasil di bagian ini diganti.", "Ya, buat ulang"))) return;
    edit((s) => void (s.sessions = generateRoundRobin(names, day)));
  }

  const playerSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <Select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 px-2">
      <option value="">—</option>
      {section.players.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </Select>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg">Peserta</h2>
        <p className="text-sm text-muted">Mengganti nama di sini ikut mengganti nama di jadwal.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {section.players.map((p, i) => (
            <li key={i} className="flex gap-2">
              <Input aria-label={`Peserta ${i + 1}`} value={p} onChange={(e) => rename(i, e.target.value)} />
              <Button variant="ghost" size="sm" aria-label={`Hapus ${p}`} onClick={() => edit((s) => void s.players.splice(i, 1))}>
                <Trash2 size={16} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => edit((s) => void s.players.push(`Peserta ${s.players.length + 1}`))}>
            <Plus size={16} aria-hidden /> Tambah peserta
          </Button>
          <div className="ml-auto flex items-end gap-2">
            <div className="w-32">
              <Field label="Hari" name="rr-day">
                <Input id="rr-day" value={day} onChange={(e) => setDay(e.target.value)} placeholder="Mis. Sabtu" />
              </Field>
            </div>
            <Button size="sm" onClick={regenerate} className="min-h-11">
              <Wand2 size={16} aria-hidden /> Buat jadwal
            </Button>
          </div>
        </div>
      </section>

      <ul className="grid gap-4 md:grid-cols-2">
        {section.sessions.map((ses, si) => (
          <li key={si} className="rounded-xl border border-line bg-surface">
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-b border-line bg-paper p-3">
              <Field label="Sesi" name={`s-${si}`}>
                <Input id={`s-${si}`} value={ses.name} onChange={(e) => edit((s) => void (s.sessions[si].name = e.target.value))} />
              </Field>
              <Field label="Hari" name={`sd-${si}`}>
                <Input id={`sd-${si}`} value={ses.day} onChange={(e) => edit((s) => void (s.sessions[si].day = e.target.value))} />
              </Field>
              <Button variant="ghost" size="sm" className="min-h-11" aria-label={`Hapus ${ses.name}`} onClick={() => edit((s) => void s.sessions.splice(si, 1))}>
                <Trash2 size={16} aria-hidden />
              </Button>
            </div>
            <ul className="divide-y divide-line">
              {ses.games.map((g, gi) => (
                <li key={gi} className="grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)_auto] items-center gap-1.5 p-2">
                  {playerSelect(g.white, (v) => edit((s) => void (s.sessions[si].games[gi].white = v)), "Putih")}
                  <Select
                    aria-label="Hasil"
                    value={g.result ?? ""}
                    onChange={(e) => edit((s) => void (s.sessions[si].games[gi].result = (e.target.value || null) as RrResult))}
                    className={cn("px-1 text-center font-mono", g.result && "border-forest font-bold")}
                  >
                    {RESULTS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                  {playerSelect(g.black, (v) => edit((s) => void (s.sessions[si].games[gi].black = v)), "Hitam")}
                  <Button variant="ghost" size="sm" className="px-2" aria-label="Hapus laga" onClick={() => edit((s) => void s.sessions[si].games.splice(gi, 1))}>
                    <Trash2 size={16} aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-end gap-2 border-t border-line p-3">
              <Button size="sm" variant="secondary" onClick={() => edit((s) => void s.sessions[si].games.push({ white: "", black: "", result: null }))}>
                <Plus size={16} aria-hidden /> Laga
              </Button>
              <label className="ml-auto block w-40 space-y-1.5">
                <span className="block text-sm font-semibold">Istirahat</span>
                {playerSelect(ses.rest, (v) => edit((s) => void (s.sessions[si].rest = v)), "Istirahat")}
              </label>
            </div>
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => edit((s) => void s.sessions.push({ name: `Sesi ${s.sessions.length + 1}`, day, games: [], rest: "" }))}
      >
        <Plus size={16} aria-hidden /> Tambah sesi
      </Button>
    </div>
  );
}
