import { NextResponse, type NextRequest } from "next/server";

/**
 * AK-07: route anggota butuh cookie sesi. Keabsahan sesi dan peran admin
 * diperiksa lagi di server oleh requireUser/requireAdmin.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("otsuka_session")) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/profil/:path*", "/admin/:path*", "/main/:path*"],
};
