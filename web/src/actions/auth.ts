"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import {
  createSession,
  destroyOtherSessions,
  destroySession,
  requireUser,
} from "@/lib/auth";
import { changePasswordSchema, loginSchema, registerSchema, safeNext } from "@/lib/validation";

const BCRYPT_COST = 12;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const GENERIC_ERROR = "Username atau password salah";
// Hash dummy agar waktu respons sama saat username tidak ada.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeOyuLZ8s6fPDnGBBG1tAe1JrQn4vUpYlW";

export type FormState = {
  error?: string;
  fields?: Record<string, string>;
  success?: string;
} | null;

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fields: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "form");
    fields[key] ??= i.message;
  }
  return fields;
}

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fields: fieldErrors(parsed.error.issues) };
  const d = parsed.data;

  const taken = await sql`
    select lower(username) = ${d.username} as same_username, lower(email) = ${d.email} as same_email
    from users where lower(username) = ${d.username} or lower(email) = ${d.email}`;
  if (taken.length) {
    const fields: Record<string, string> = {};
    if (taken.some((t) => t.same_username)) fields.username = "Username sudah dipakai";
    if (taken.some((t) => t.same_email)) fields.email = "Email sudah terdaftar";
    return { fields };
  }

  const hash = await bcrypt.hash(d.password, BCRYPT_COST);
  const rows = await sql`
    insert into users (full_name, username, email, division, password_hash, last_login_at)
    values (${d.fullName}, ${d.username}, ${d.email}, ${d.division}, ${hash}, now())
    on conflict do nothing returning id`;
  if (!rows[0]) return { error: "Username atau email sudah terdaftar" };

  await createSession(rows[0].id);
  redirect("/profil");
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    identifier: form.get("identifier"),
    password: form.get("password"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error.issues) };
  const { identifier, password } = parsed.data;

  const rows = await sql`
    select id, password_hash, is_active, must_change_password, locked_until,
           failed_login_count, last_failed_login_at
    from users where lower(username) = ${identifier} or lower(email) = ${identifier}
    limit 1`;
  const user = rows[0];

  if (user?.locked_until && new Date(user.locked_until) > new Date()) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { error: `Terlalu banyak percobaan. Coba lagi dalam ${LOCK_MINUTES} menit.` };
  }

  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !ok || !user.is_active) {
    if (user) {
      // Hitungan gagal hanya berlaku dalam jendela 15 menit (AK-08).
      await sql`
        update users set
          failed_login_count = case
            when last_failed_login_at > now() - make_interval(mins => ${LOCK_MINUTES})
            then failed_login_count + 1 else 1 end,
          last_failed_login_at = now(),
          locked_until = case
            when last_failed_login_at > now() - make_interval(mins => ${LOCK_MINUTES})
                 and failed_login_count + 1 >= ${MAX_FAILED}
            then now() + make_interval(mins => ${LOCK_MINUTES}) else null end
        where id = ${user.id}`;
    }
    return { error: GENERIC_ERROR };
  }

  await sql`
    update users set failed_login_count = 0, locked_until = null, last_login_at = now()
    where id = ${user.id}`;
  await createSession(user.id);

  redirect(user.must_change_password ? "/profil" : safeNext(form.get("next")));
}

export async function logoutAction() {
  await destroySession();
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fields: fieldErrors(parsed.error.issues) };

  const rows = await sql`select password_hash from users where id = ${user.id}`;
  const ok = await bcrypt.compare(parsed.data.oldPassword, rows[0].password_hash);
  if (!ok) return { fields: { oldPassword: "Password lama salah" } };

  const hash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_COST);
  await sql`
    update users set password_hash = ${hash}, must_change_password = false where id = ${user.id}`;
  await destroyOtherSessions(user.id);

  return { success: "Password berhasil diganti. Sesi di perangkat lain sudah dikeluarkan." };
}
