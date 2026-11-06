import postgres from "postgres";

process.loadEnvFile(".env.local");

export function connect() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL belum diisi di .env.local");
  return postgres(url.replace(/[?&]pgbouncer=[^&]*/, ""), { prepare: false, max: 1, onnotice: () => {} });
}
