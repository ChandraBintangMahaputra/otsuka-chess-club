"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Crown,
  Ellipsis,
  Trophy,
  FileText,
  House,
  Images,
  LogOut,
  Puzzle,
  Shield,
  Swords,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { buttonClass, cn } from "@/components/ui";
import { useMe } from "./me-provider";

const L = {
  beranda: { href: "/", label: "Beranda", icon: House },
  belajar: { href: "/belajar", label: "Belajar", icon: BookOpen },
  opening: { href: "/opening", label: "Opening", icon: Swords },
  puzzle: { href: "/puzzle", label: "Puzzle", icon: Puzzle },
  main: { href: "/main", label: "Main", icon: Crown },
  peringkat: { href: "/peringkat", label: "Peringkat", icon: Trophy },
  kegiatan: { href: "/kegiatan", label: "Kegiatan", icon: CalendarDays },
  artikel: { href: "/artikel", label: "Artikel", icon: FileText },
  dokumentasi: { href: "/dokumentasi", label: "Dokumentasi", icon: Images },
};

// HP: 4 tombol utama + Lainnya. Desktop: Beranda lewat logo.
const PRIMARY = [L.beranda, L.belajar, L.puzzle, L.main];
const MORE = [L.opening, L.peringkat, L.kegiatan, L.artikel, L.dokumentasi];
const DESKTOP = [L.belajar, L.opening, L.puzzle, L.main, L.peringkat];
const DESKTOP_MORE = [L.kegiatan, L.artikel, L.dokumentasi];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

const desktopItem = (active: boolean) =>
  cn(
    "rounded-lg px-3 py-2 text-[15px] font-medium transition-colors duration-150",
    active ? "bg-forest/10 text-forest" : "text-ink hover:bg-line/50",
  );

export function DesktopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menu.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
      {DESKTOP.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={desktopItem(isActive(pathname, href))}
        >
          {label}
        </Link>
      ))}
      <div ref={menu} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-lainnya-desktop"
          onClick={() => setOpen((o) => !o)}
          className={cn(desktopItem(DESKTOP_MORE.some((l) => isActive(pathname, l.href))), "flex items-center gap-1")}
        >
          Lainnya <ChevronDown size={16} aria-hidden />
        </button>
        {open && (
          <ul
            id="menu-lainnya-desktop"
            className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-line bg-surface p-1 shadow-lg"
          >
            {DESKTOP_MORE.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className={cn(desktopItem(isActive(pathname, href)), "flex items-center gap-2")}
                >
                  <Icon size={18} aria-hidden /> {label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}

/** Di HP menu pindah ke bawah agar papan tetap lega (FSD 4). */
export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = MORE.some((l) => isActive(pathname, l.href));
  const item = "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold";

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {open && (
        <ul id="menu-lainnya" className="border-b border-line">
          {MORE.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 px-5 font-semibold",
                  isActive(pathname, href) ? "text-forest" : "text-ink",
                )}
              >
                <Icon size={20} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ul className="grid grid-cols-5">
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(item, active ? "text-forest" : "text-muted")}
              >
                <Icon size={20} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu-lainnya"
            onClick={() => setOpen((o) => !o)}
            className={cn(item, open || moreActive ? "text-forest" : "text-muted")}
          >
            <Ellipsis size={20} aria-hidden />
            Lainnya
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AuthNav() {
  const { user, loading } = useMe();

  if (loading) return <div className="h-11 w-24 sm:w-40" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={buttonClass("ghost", "sm")}>
          Masuk
        </Link>
        <Link href="/register" className={buttonClass("primary", "sm")}>
          Daftar
        </Link>
      </div>
    );
  }

  async function logout() {
    await logoutAction();
    window.location.assign("/");
  }

  return (
    <div className="flex items-center gap-1">
      {user.role === "admin" && (
        <Link href="/admin" className={buttonClass("ghost", "sm")} aria-label="Panel admin">
          <Shield size={18} aria-hidden />
          <span className="hidden lg:inline">Admin</span>
        </Link>
      )}
      <Link href="/profil" className={buttonClass("ghost", "sm", "max-w-40")}>
        <UserRound size={18} aria-hidden />
        <span className="truncate">{user.fullName.split(" ")[0]}</span>
      </Link>
      <button type="button" onClick={logout} className={buttonClass("ghost", "sm")} aria-label="Keluar">
        <LogOut size={18} aria-hidden />
      </button>
    </div>
  );
}

/** LP-12: tombol hero berganti bila pengguna sudah login. */
export function HeroCta() {
  const { user } = useMe();
  return (
    <div className="flex flex-wrap gap-3">
      <Link href={user ? "/belajar" : "/register"} className={buttonClass("onDark")}>
        {user ? "Lanjut Belajar" : "Gabung Klub"}
      </Link>
      {!user && (
        <Link
          href="/belajar"
          className={buttonClass("ghost", "md", "border border-on-forest/40 text-on-forest hover:bg-white/10")}
        >
          Mulai Belajar
        </Link>
      )}
    </div>
  );
}
