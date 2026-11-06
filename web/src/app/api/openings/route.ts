import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchOpenings } from "@/lib/queries";

const schema = z.object({
  q: z.string().trim().max(100).optional(),
  side: z.enum(["white", "black"]).optional(),
  level: z.enum(["pemula", "menengah"]).optional(),
  first: z.enum(["1.e4", "1.d4", "lain"]).optional(),
  notes: z.enum(["ada"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});

/** Pencarian katalog opening. Hanya membaca opening yang terbit. */
export async function GET(request: NextRequest) {
  const raw = Object.fromEntries([...request.nextUrl.searchParams].filter(([, v]) => v));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "filter tidak valid" }, { status: 400 });
  return NextResponse.json(await searchOpenings(parsed.data));
}
