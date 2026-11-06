import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { MeProvider } from "@/components/site/me-provider";
import { AuthNav, BottomNav, DesktopNav } from "@/components/site/nav";
import { Container } from "@/components/ui";
import { getSiteSettings } from "@/lib/site-queries";

const isPublic = process.env.PUBLIC_SITE === "true";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "Otsuka Chess", template: "%s · Otsuka Chess" },
  description: "Klub catur karyawan: belajar dasar, latihan opening, dan puzzle taktik.",
  openGraph: { siteName: "Otsuka Chess", locale: "id_ID", type: "website" },
  robots: isPublic ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#1f4d3f" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { footer } = await getSiteSettings();
  return (
    <html lang="id">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
        >
          Lompat ke konten
        </a>
        <MeProvider>
          <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
            <Container className="flex h-16 items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
                <span className="grid size-9 place-items-center rounded-lg bg-forest p-1">
                  <Image src="/pieces/wN.svg" alt="" width={28} height={28} unoptimized />
                </span>
                Otsuka Chess
              </Link>
              <DesktopNav />
              <AuthNav />
            </Container>
          </header>

          <main id="konten" className="flex-1 pb-20 lg:pb-0">
            {children}
          </main>

          <footer className="mb-14 border-t border-line bg-surface lg:mb-0">
            <Container className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>{footer.text}</p>
              {footer.contactHref ? (
                <a href={footer.contactHref} className="font-semibold text-forest underline">
                  {footer.contactLabel || "Hubungi pengurus"}
                </a>
              ) : (
                footer.contactLabel && <p>{footer.contactLabel}</p>
              )}
            </Container>
          </footer>
          <BottomNav />
        </MeProvider>
      </body>
    </html>
  );
}
