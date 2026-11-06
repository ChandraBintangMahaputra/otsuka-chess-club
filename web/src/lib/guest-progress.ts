/** Progres tamu di localStorage (BD-07). Selalu dibungkus try/catch karena storage bisa diblokir. */
const DONE = "otsuka-lessons-done";
const STARTED = "otsuka-lessons-started";

function read(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function add(key: string, id: string) {
  try {
    const list = read(key);
    if (!list.includes(id)) localStorage.setItem(key, JSON.stringify([...list, id]));
  } catch {
    /* storage tidak tersedia */
  }
}

export const guestDone = () => read(DONE);
export const guestStarted = () => read(STARTED);
export const markGuestDone = (id: string) => add(DONE, id);
export const markStarted = (id: string) => add(STARTED, id);

export function clearGuestDone() {
  try {
    localStorage.removeItem(DONE);
  } catch {
    /* storage tidak tersedia */
  }
}
