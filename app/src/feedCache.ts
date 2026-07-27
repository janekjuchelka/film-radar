import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TitleItem } from "./types";

const FEED_CACHE_KEY = "filmradar.feedCache.v1";

export type FeedCache = {
  titles: TitleItem[];
  updatedAt: string | null;
  savedAt: string;
};

export async function loadFeedCache(): Promise<FeedCache | null> {
  try {
    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeedCache;
    if (!parsed || !Array.isArray(parsed.titles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveFeedCache(
  titles: TitleItem[],
  updatedAt: string | null
): Promise<void> {
  const payload: FeedCache = {
    titles,
    updatedAt,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(payload));
}
