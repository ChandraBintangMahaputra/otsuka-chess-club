import "server-only";
import postgres from "postgres";

/**
 * Satu-satunya pintu ke Supabase Postgres (FSD 3 dan 6.2). Hanya berjalan di server.
 * Lewat transaction pooler, jadi prepared statement dimatikan.
 */
function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi");
  return postgres(url.replace(/[?&]pgbouncer=[^&]*/, ""), {
    prepare: false,
    // Supavisor di port 6543 bisa macet pada query yang dipipeline di transaction mode.
    max_pipeline: 1,
    // Bila pooler berhenti menjawab, query gagal dengan jelas dan tidak menggantung selamanya.
    query_timeout: 30,
    // Build lokal memakai banyak worker, jadi satu koneksi per worker sudah cukup.
    max: process.env.NEXT_PHASE === "phase-production-build" && !process.env.VERCEL ? 1 : 3,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
  });
}

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof create> };

export const sql = globalForDb.sql ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
