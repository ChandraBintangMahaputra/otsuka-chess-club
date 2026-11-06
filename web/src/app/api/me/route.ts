import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

/**
 * Halaman publik dibuat statis, jadi status login dibaca dari sini oleh browser.
 * Hanya mengirim data milik sesi aktif.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, completedLessons: [] });

  const rows = await sql`select lesson_id from lesson_progress where user_id = ${user.id}`;
  return NextResponse.json({
    user: { fullName: user.fullName, username: user.username, role: user.role },
    completedLessons: rows.map((r) => r.lesson_id),
  });
}
