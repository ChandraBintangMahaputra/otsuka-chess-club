import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { detectImageMime } from "@/lib/post";

const MAX_BYTES = 3 * 1024 * 1024;

/** Upload foto oleh admin. Browser sudah mengecilkan foto, batas ini hanya pengaman. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Foto terlalu besar" }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = detectImageMime(bytes);
  if (!mime) return NextResponse.json({ error: "Format harus JPG, PNG, atau WebP" }, { status: 415 });

  const [row] = await sql`
    insert into media (mime, bytes, size, created_by)
    values (${mime}, ${bytes}, ${bytes.length}, ${user.id}) returning id`;
  return NextResponse.json({ path: `/media/${row.id}` });
}
