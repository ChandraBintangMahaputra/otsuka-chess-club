import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";

export const SESSION_COOKIE = "otsuka_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  division: string;
  role: "member" | "admin";
  puzzleRating: number;
  mustChangePassword: boolean;
};

function hashToken(token: string) {
  const secret = process.env.SESSION_SECRET;
  if (secret) return createHmac("sha256", secret).update(token).digest("hex");
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await sql`
    insert into sessions (user_id, token_hash, expires_at, user_agent, ip)
    values (${userId}, ${hashToken(token)}, ${expires}, ${h.get("user-agent")}, ${ip})`;

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  store.delete(SESSION_COOKIE);
}

/** Menghapus semua sesi anggota kecuali sesi yang sedang dipakai (AK-09). */
export async function destroyOtherSessions(userId: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await sql`delete from sessions where user_id = ${userId} and token_hash <> ${hashToken(token)}`;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await sql`
    select u.id, u.full_name, u.username, u.email, u.division, u.role,
           u.puzzle_rating, u.must_change_password
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${hashToken(token)} and s.expires_at > now() and u.is_active`;
  const u = rows[0];
  if (!u) return null;

  return {
    id: u.id,
    fullName: u.full_name,
    username: u.username,
    email: u.email,
    division: u.division,
    role: u.role,
    puzzleRating: u.puzzle_rating,
    mustChangePassword: u.must_change_password,
  };
});

export async function requireUser(next = "/profil") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/?akses=ditolak");
  return user;
}
