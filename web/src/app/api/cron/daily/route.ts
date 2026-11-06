import { NextResponse, type NextRequest } from "next/server";
import { getDailyPuzzle } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Cron harian Vercel: mengisi puzzle harian dan menjaga project Supabase tetap aktif. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const puzzle = await getDailyPuzzle();
  return NextResponse.json({ ok: true, puzzleId: puzzle?.id ?? null });
}
