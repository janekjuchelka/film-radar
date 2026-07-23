import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "filmradar.apiBaseUrl";

/**
 * Stálá adresa feedu na GitHubu.
 * Po vytvoření repozitáře nahraď USERNAME svým GitHub jménem.
 */
export const DEFAULT_API_BASE_URL =
  "https://raw.githubusercontent.com/janekjuchelka/film-radar/main/feed/titles.json";

export function titlesUrlFromBase(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/$/, "");
  if (clean.endsWith(".json")) return clean;
  return `${clean}/titles`;
}

export async function getApiBaseUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      return saved.trim().replace(/\/$/, "");
    }
  } catch {
    // ignore
  }
  return DEFAULT_API_BASE_URL.replace(/\/$/, "");
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
