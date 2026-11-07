"use client";

import { useEffect, useRef, useState } from "react";
import { RealtimeClient } from "@supabase/realtime-js";

/**
 * Supabase Realtime, dipakai hemat agar tetap di batas paket gratis
 * (200 koneksi bersamaan, 2 juta pesan per bulan, 100 pesan per detik):
 * - Koneksi hanya dibuka di halaman Main, satu koneksi per tab, dan diputus
 *   bila tab disembunyikan lebih dari 2 menit atau tidak ada channel aktif.
 * - Jam catur dihitung di browser, tidak ada pesan per detik.
 * - Isi pesan hanya sinyal "ada perubahan". Data diambil dari server.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const realtimeConfigured = Boolean(URL && KEY);

export const topics = {
  lobby: "otsuka:lobby",
  user: (id: string) => `otsuka:user:${id}`,
  game: (id: string) => `otsuka:game:${id}`,
};

let client: RealtimeClient | null = null;

function getClient() {
  if (!URL || !KEY) return null;
  client ??= new RealtimeClient(`${URL.replace(/^http/, "ws")}/realtime/v1`, {
    params: { apikey: KEY },
    heartbeatIntervalMs: 30_000,
  });
  return client;
}

export type ChannelStatus = "off" | "connecting" | "live" | "error";

type ChannelOptions = {
  enabled: boolean;
  events?: string[];
  onEvent?: (event: string, payload: Record<string, unknown>) => void;
  presence?: { key: string; data: Record<string, unknown> };
  onPresence?: (members: Record<string, unknown>[]) => void;
};

/** Berlangganan satu channel. Status presence hanya dikirim sekali setiap kali tersambung. */
export function useChannel(topic: string | null, opts: ChannelOptions): ChannelStatus {
  const handlers = useRef(opts);
  useEffect(() => {
    handlers.current = opts;
  });

  const key = `${topic}|${opts.enabled}`;
  const [state, setState] = useState<{ key: string; status: ChannelStatus } | null>(null);
  const events = (opts.events ?? []).join(",");
  const presenceKey = opts.presence?.key ?? "";
  const presenceData = JSON.stringify(opts.presence?.data ?? null);

  useEffect(() => {
    const c = getClient();
    if (!c || !topic || !opts.enabled) return;

    const ch = c.channel(topic, {
      config: { broadcast: { self: false }, presence: { key: presenceKey } },
    });
    for (const event of events ? events.split(",") : []) {
      ch.on("broadcast", { event }, (msg) => handlers.current.onEvent?.(event, msg.payload ?? {}));
    }
    if (presenceKey) {
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState() as Record<string, Record<string, unknown>[]>;
        handlers.current.onPresence?.(Object.values(state).map((list) => list[0]));
      });
    }
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setState({ key, status: "live" });
        if (presenceKey) ch.track(JSON.parse(presenceData));
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setState({ key, status: "error" });
      }
    });

    return () => {
      c.removeChannel(ch);
      if (c.getChannels().length === 0) c.disconnect();
    };
  }, [topic, opts.enabled, events, presenceKey, presenceData, key]);

  if (!realtimeConfigured || !topic || !opts.enabled) return "off";
  return state?.key === key ? state.status : "connecting";
}

/** Mengirim sinyal ke channel lain lewat REST, tanpa ikut bergabung ke channel itu. */
export async function notify(topic: string, event: string, payload: Record<string, unknown> = {}) {
  if (!URL || !KEY) return;
  try {
    await fetch(`${URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic, event, payload }] }),
    });
  } catch {
    // Sinyal gagal tidak fatal: halaman lain tetap memuat ulang lewat polling cadangan.
  }
}

/** False bila tab disembunyikan lebih lama dari `graceMs`, agar koneksi dilepas. */
export function useTabActive(graceMs = 120_000) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      clearTimeout(timer);
      if (document.hidden) timer = setTimeout(() => setActive(false), graceMs);
      else setActive(true);
    };
    document.addEventListener("visibilitychange", onChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onChange);
    };
  }, [graceMs]);
  return active;
}

/** Polling cadangan, dipakai hanya saat realtime tidak tersambung. Tidak memakai kuota Supabase. */
export function usePolling(run: () => void, intervalMs: number, enabled: boolean) {
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => latest.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
