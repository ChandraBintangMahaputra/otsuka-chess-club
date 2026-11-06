"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  changePasswordAction,
  loginAction,
  registerAction,
  type FormState,
} from "@/actions/auth";
import { Button, Field, Input } from "@/components/ui";
import { useSubmit } from "@/lib/use-submit";

function FormError({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm font-medium text-danger">
      {state.error}
    </p>
  );
}

function TextField({
  name,
  label,
  state,
  help,
  ...props
}: { name: string; label: string; state: FormState; help?: string } & React.ComponentProps<"input">) {
  const error = state?.fields?.[name];
  return (
    <Field label={label} name={name} error={error} help={help}>
      <Input
        id={name}
        name={name}
        required
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
    </Field>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const onSubmit = useSubmit(action);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError state={state} />
      <TextField name="identifier" placeholder="Mis. budi.santoso atau budi@kantor.co.id" label="Username atau email" state={state} autoComplete="username" />
      <TextField name="password" placeholder="Masukkan password" label="Password" type="password" state={state} autoComplete="current-password" />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>
      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-forest underline">
          Daftar
        </Link>
      </p>
      <p className="text-center text-sm text-muted">Lupa password? Minta pengurus mereset akunmu.</p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);
  const onSubmit = useSubmit(action);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError state={state} />
      <TextField name="fullName" placeholder="Mis. Budi Santoso" label="Nama lengkap" state={state} autoComplete="name" />
      <TextField
        name="username" placeholder="Mis. budi.santoso"
        label="Username"
        state={state}
        autoComplete="username"
        help="3–20 karakter: huruf kecil, angka, titik, garis bawah."
      />
      <TextField name="email" placeholder="nama@kantor.co.id" label="Email kantor" type="email" state={state} autoComplete="email" />
      <TextField name="division" placeholder="Mis. Teknologi Informasi" label="Divisi" state={state} autoComplete="organization-title" />
      <TextField
        name="password"
        placeholder="Minimal 8 karakter, huruf dan angka"
        label="Password"
        type="password"
        state={state}
        autoComplete="new-password"
        help="Minimal 8 karakter, berisi huruf dan angka."
      />
      <TextField name="confirmPassword" placeholder="Ulangi password" label="Konfirmasi password" type="password" state={state} autoComplete="new-password" />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Mendaftarkan…" : "Daftar"}
      </Button>
      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-forest underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  const onSubmit = useSubmit(action);
  return (
    // Key berganti setelah berhasil agar kolom password kosong kembali.
    <form key={state?.success ?? "form"} onSubmit={onSubmit} className="space-y-4">
      <FormError state={state} />
      {state?.success && (
        <p role="status" className="rounded-lg bg-success-soft p-3 text-sm font-medium text-success">
          {state.success}
        </p>
      )}
      <TextField name="oldPassword" placeholder="Password yang dipakai sekarang" label="Password lama" type="password" state={state} autoComplete="current-password" />
      <TextField
        name="newPassword" placeholder="Minimal 8 karakter, huruf dan angka"
        label="Password baru"
        type="password"
        state={state}
        autoComplete="new-password"
        help="Minimal 8 karakter, berisi huruf dan angka."
      />
      <TextField name="confirmPassword" placeholder="Ulangi password baru" label="Konfirmasi password baru" type="password" state={state} autoComplete="new-password" />
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Ganti password"}
      </Button>
    </form>
  );
}
