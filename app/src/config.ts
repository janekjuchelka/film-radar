import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "filmradar.apiBaseUrl";

/**
 * Stálá adresa feedu přímo z GitHubu (bez CDN cache jako u jsDelivr).
 */
export const DEFAULT_API_BASE_URL =
  "https://raw.githubusercontent.com/janekjuchelka/film-radar/main/feed/titles.json";

function isBrokenUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("trycloudflare.com") ||
    u.includes("127.0.0.1") ||
    u.includes("10.238.") ||
    u.includes("your-server") ||
    u.includes("localhost") ||
    u.includes("username") ||
    u.includes("onrender.com") ||
    u.includes("fly.dev") ||
    // starý CDN mirror — často drží včerejší JSON
    u.includes("cdn.jsdelivr.net")
  );
}

export function titlesUrlFromBase(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/$/, "");
  if (clean.endsWith(".json")) return clean;
  return `${clean}/titles`;
}

/** Přidá timestamp, aby Android/CDN nevracely starý feed. */
export function withCacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

export async function getApiBaseUrl(): Promise<string> {
  const fallback = DEFAULT_API_BASE_URL.replace(/\/$/, "");
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      const clean = saved.trim().replace(/\/$/, "");
      if (isBrokenUrl(clean)) {
        await AsyncStorage.setItem(STORAGE_KEY, fallback);
        return fallback;
      }
      return clean;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export async function setApiBaseUrl(url: string): Promise<string> {
  const clean = url.trim().replace(/\/$/, "");
  await AsyncStorage.setItem(STORAGE_KEY, clean);
  const check = await AsyncStorage.getItem(STORAGE_KEY);
  if (check !== clean) {
    throw new Error("Nepodařilo se uložit adresu serveru");
  }
  return clean;
}

export async function resetToDefaultFeed(): Promise<string> {
  const fallback = DEFAULT_API_BASE_URL.replace(/\/$/, "");
  await AsyncStorage.setItem(STORAGE_KEY, fallback);
  return fallback;
}
