import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { TitleItem } from "./types";

const KNOWN_IDS_KEY = "filmradar.knownTitleIds.v1";
const NOTIFY_MIN_RATING = 75;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function readKnownIds(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KNOWN_IDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

async function writeKnownIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KNOWN_IDS_KEY, JSON.stringify(Array.from(new Set(ids))));
}

function providerLabel(providers: TitleItem["providers"]): string {
  const map: Record<string, string> = {
    netflix: "Netflix",
    disney: "Disney+",
    oneplay: "Oneplay",
  };
  return (providers || []).map((p) => map[p] || p).join(", ") || "stream";
}

/**
 * Po načtení feedu: nové tituly s ČSFD ≥ 75 % → lokální notifikace.
 * První běh jen uloží ID (bez spamu).
 */
export async function notifyNewHighRated(titles: TitleItem[]): Promise<void> {
  const ids = titles.map((t) => t.id);
  const known = await readKnownIds();

  if (!known) {
    await writeKnownIds(ids);
    return;
  }

  const knownSet = new Set(known);
  const fresh = titles.filter(
    (t) =>
      !knownSet.has(t.id) &&
      typeof t.csfdRating === "number" &&
      t.csfdRating >= NOTIFY_MIN_RATING
  );

  await writeKnownIds([...known, ...ids]);

  if (!fresh.length) return;

  const allowed = await ensureNotificationPermission();
  if (!allowed) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("high-rated", {
      name: "Novinky ≥ 75 %",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (fresh.length === 1) {
    const t = fresh[0];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Novinka · ${t.csfdRating} % ČSFD`,
        body: `${t.title} · ${providerLabel(t.providers)}`,
        sound: true,
      },
      trigger: null,
    });
    return;
  }

  const top = fresh
    .slice()
    .sort((a, b) => (b.csfdRating ?? 0) - (a.csfdRating ?? 0))
    .slice(0, 3)
    .map((t) => `${t.title} (${t.csfdRating} %)`)
    .join(", ");

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${fresh.length} nových titulů ≥ 75 %`,
      body: top,
      sound: true,
    },
    trigger: null,
  });
}
