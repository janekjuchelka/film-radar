import AsyncStorage from "@react-native-async-storage/async-storage";

const WATCHLIST_KEY = "filmradar.watchlist";
const SEEN_KEY = "filmradar.seen";

async function readIds(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function writeIds(key: string, ids: string[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
}

export async function loadLibrary() {
  const [watchlist, seen] = await Promise.all([
    readIds(WATCHLIST_KEY),
    readIds(SEEN_KEY),
  ]);
  return { watchlist, seen };
}

export async function toggleWatchlist(id: string, current: string[]) {
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  await writeIds(WATCHLIST_KEY, next);
  return next;
}

export async function markSeen(id: string, seen: string[], watchlist: string[]) {
  const nextSeen = seen.includes(id) ? seen : [...seen, id];
  const nextWatch = watchlist.filter((x) => x !== id);
  await writeIds(SEEN_KEY, nextSeen);
  await writeIds(WATCHLIST_KEY, nextWatch);
  return { seen: nextSeen, watchlist: nextWatch };
}

export async function unmarkSeen(id: string, seen: string[]) {
  const next = seen.filter((x) => x !== id);
  await writeIds(SEEN_KEY, next);
  return next;
}

export function isFresh(firstSeenAt: string, days = 3): boolean {
  const t = Date.parse(firstSeenAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < days * 24 * 60 * 60 * 1000;
}

export function formatUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "Aktualizace neznámá";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Aktualizace neznámá";
  return `Aktualizováno ${d.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
