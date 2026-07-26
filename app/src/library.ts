import AsyncStorage from "@react-native-async-storage/async-storage";

const WATCHLIST_KEY = "filmradar.watchlist";
const SEEN_KEY = "filmradar.seen";
/** Trvale smazané tituly — po refreshi ani po restartu se nevrátí. */
const HIDDEN_KEY = "filmradar.hidden";

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
  const unique = Array.from(new Set(ids.map(String)));
  await AsyncStorage.setItem(key, JSON.stringify(unique));
  const check = await AsyncStorage.getItem(key);
  if (check !== JSON.stringify(unique)) {
    throw new Error("Nepodařilo se uložit seznam");
  }
}

export async function loadLibrary() {
  const [watchlist, seen, hidden] = await Promise.all([
    readIds(WATCHLIST_KEY),
    readIds(SEEN_KEY),
    readIds(HIDDEN_KEY),
  ]);
  return { watchlist, seen, hidden };
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

/**
 * Trvale skryje titul. Vždy čte aktuální stav z disku (bez race při rychlém swipe).
 */
export async function hideTitleForever(id: string) {
  const [hidden, watchlist] = await Promise.all([
    readIds(HIDDEN_KEY),
    readIds(WATCHLIST_KEY),
  ]);
  const nextHidden = hidden.includes(id) ? hidden : [...hidden, id];
  const nextWatch = watchlist.filter((x) => x !== id);
  await writeIds(HIDDEN_KEY, nextHidden);
  await writeIds(WATCHLIST_KEY, nextWatch);
  return { hidden: nextHidden, watchlist: nextWatch };
}

/** @deprecated alias */
export async function hideTitle(
  id: string,
  _hidden?: string[],
  _watchlist?: string[]
) {
  return hideTitleForever(id);
}

export async function unhideTitle(id: string, hidden: string[]) {
  const next = hidden.filter((x) => x !== id);
  await writeIds(HIDDEN_KEY, next);
  return next;
}

export function isFresh(iso: string, days = 3): boolean {
  const t = Date.parse(iso);
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

export function eventLabel(
  eventType: string | null | undefined,
  type: "movie" | "series"
): string | null {
  if (eventType === "new_season") return "Nová řada";
  if (eventType === "new_series") return "Nový seriál";
  if (eventType === "new_movie") return "Nový film";
  if (type === "series") return "Seriál";
  return "Film";
}
