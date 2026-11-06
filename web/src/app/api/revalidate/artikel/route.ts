import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/** Dipanggil server MCP artikel agar perubahan langsung tampil di halaman publik. */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  revalidatePath("/artikel");
  revalidatePath("/artikel/[slug]", "page");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
