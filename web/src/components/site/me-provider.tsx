"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { mergeGuestProgressAction } from "@/actions/learning";
import { clearGuestDone, guestDone } from "@/lib/guest-progress";

type Me = { fullName: string; username: string; role: "member" | "admin" };
type MeState = { user: Me | null; completed: Set<string>; loading: boolean };

const MeContext = createContext<MeState>({ user: null, completed: new Set(), loading: true });

export const useMe = () => useContext(MeContext);

/** Halaman publik statis, jadi status login dibaca di browser dan tidak memaksa render dinamis. */
export function MeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<Me | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        let done: string[] = data.completedLessons ?? [];

        const pending = guestDone();
        if (data.user && pending.length) {
          // AK-12: progres tamu digabung ke akun setelah login.
          await mergeGuestProgressAction(pending);
          clearGuestDone();
          done = [...new Set([...done, ...pending])];
        }
        if (!active) return;
        setUser(data.user);
        setCompleted(done);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  const value = useMemo(() => ({ user, completed: new Set(completed), loading }), [user, completed, loading]);
  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}
