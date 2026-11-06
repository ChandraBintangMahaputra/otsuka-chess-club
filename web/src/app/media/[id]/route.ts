import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Isi foto tidak pernah berubah, jadi boleh disimpan lama di cache browser dan CDN. */
export async function GET(_: Request, { params }: RouteContext<"/media/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse(null, { status: 404 });

  const [row] = await sql`select mime, bytes from media where id = ${id}`;
  if (!row) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
