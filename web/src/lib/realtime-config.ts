import "server-only";
import type { RealtimeConfig } from "./realtime";

/**
 * Dibaca saat halaman Main dibuka. Nilai ini memang dikirim ke browser
 * (publishable/anon key dirancang publik), jadi jangan isi dengan secret key.
 */
export function realtimeConfig(): RealtimeConfig {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (key.startsWith("sb_secret_")) throw new Error("SUPABASE_ANON_KEY berisi secret key. Gunakan publishable/anon key.");
  return { url: url.replace(/\/$/, ""), key };
}
