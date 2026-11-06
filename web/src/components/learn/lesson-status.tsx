"use client";

import { useSyncExternalStore } from "react";
import { useMe } from "@/components/site/me-provider";
import { Badge } from "@/components/ui";
import { guestDone, guestStarted } from "@/lib/guest-progress";

const subscribe = () => () => {};

/** BD-01: status materi dibaca di browser agar halaman daftar tetap statis. */
export function LessonStatus({ lessonId }: { lessonId: string }) {
  const { completed } = useMe();
  const local = useSyncExternalStore(
    subscribe,
    () => (guestDone().includes(lessonId) ? "done" : guestStarted().includes(lessonId) ? "started" : "none"),
    () => "none",
  );

  if (completed.has(lessonId) || local === "done") return <Badge tone="success">Selesai</Badge>;
  if (local === "started") return <Badge tone="copper">Sedang</Badge>;
  return <Badge>Belum</Badge>;
}
