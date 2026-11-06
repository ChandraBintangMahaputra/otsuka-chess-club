import { z } from "zod";
import { DEPARTMENTS } from "./departments";

const password = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .regex(/[a-zA-Z]/, "Password harus berisi huruf")
  .regex(/[0-9]/, "Password harus berisi angka");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Nama lengkap wajib diisi").max(100),
    username: z
      .string()
      .trim()
      .regex(/^[a-z0-9._]{3,20}$/, "Username 3–20 karakter: huruf kecil, angka, titik, garis bawah"),
    email: z.string().trim().toLowerCase().email("Format email tidak valid").max(200),
    division: z.enum(DEPARTMENTS, { error: "Pilih departemen dari daftar" }),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, "Isi username atau email").max(200),
  password: z.string().min(1, "Isi password").max(200),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Isi password lama"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const attemptSchema = z.object({
  puzzleId: z.string().uuid(),
  solved: z.boolean(),
  usedHint: z.boolean(),
  timeMs: z.number().int().min(0).max(86_400_000),
});

/** Hanya izinkan path internal agar parameter `next` tidak jadi open redirect. */
export function safeNext(next: unknown, fallback = "/profil") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
