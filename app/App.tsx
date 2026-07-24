import {
  BebasNeue_400Regular,
  useFonts as useBebas,
} from "@expo-google-fonts/bebas-neue";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts as useDmSans,
} from "@expo-google-fonts/dm-sans";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  resetToDefaultFeed,
  setApiBaseUrl,
  titlesUrlFromBase,
  withCacheBust,
} from "./src/config";
import {
  formatUpdatedAt,
  isFresh,
  loadLibrary,
  markSeen,
  toggleWatchlist,
  unmarkSeen,
} from "./src/library";
import type { ProviderFilter, TitleItem, TitleTypeFilter } from "./src/types";

type TabKey = "discover" | "fresh" | "watchlist";

const PROVIDER_LABEL: Record<string, string> = {
  netflix: "Netflix",
  disney: "Disney+",
  oneplay: "Oneplay",
};

const PROVIDER_COLOR: Record<string, string> = {
  netflix: "#E50914",
  disney: "#1A6DFF",
  oneplay: "#00C2A8",
};

export default function App() {
  const [bebasLoaded] = useBebas({ BebasNeue_400Regular });
  const [dmLoaded] = useDmSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const [hydrated, setHydrated] = useState(false);
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>("discover");
  const [typeFilter, setTypeFilter] = useState<TitleTypeFilter>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [seen, setSeen] = useState<string[]>([]);

  const [apiUrl, setApiUrlState] = useState(DEFAULT_API_BASE_URL);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detail, setDetail] = useState<TitleItem | null>(null);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_API_BASE_URL);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [url, library] = await Promise.all([getApiBaseUrl(), loadLibrary()]);
      if (cancelled) return;
      setApiUrlState(url);
      setDraftUrl(url);
      setWatchlist(library.watchlist);
      setSeen(library.seen);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(
    async (isRefresh = false, baseUrl = apiUrl) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const url = withCacheBust(titlesUrlFromBase(baseUrl));
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) throw new Error("HTTP " + res.status + "\nURL: " + url);
        const data = await res.json();
        const list = Array.isArray(data.titles) ? (data.titles as TitleItem[]) : [];
        if (!Array.isArray(data.titles)) {
          throw new Error("Neplatná odpověď feedu\nURL: " + url);
        }
        setTitles(list);
        setUpdatedAt(data.updatedAt ?? data.meta?.lastScanAt ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setTitles([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    if (!hydrated) return;
    load(false, apiUrl);
  }, [hydrated, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleTitles = useMemo(() => {
    let list = titles;
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (providerFilter !== "all") {
      list = list.filter((t) => t.providers?.includes(providerFilter));
    }
    if (tab === "fresh") {
      list = list.filter((t) => isFresh(t.firstSeenAt) && !seen.includes(t.id));
    } else if (tab === "watchlist") {
      list = list.filter((t) => watchlist.includes(t.id));
    } else {
      list = list.filter((t) => !seen.includes(t.id));
    }
    return list;
  }, [titles, typeFilter, providerFilter, tab, seen, watchlist]);

  const freshCount = useMemo(
    () => titles.filter((t) => isFresh(t.firstSeenAt) && !seen.includes(t.id)).length,
    [titles, seen]
  );

  async function onToggleWatch(id: string) {
    const next = await toggleWatchlist(id, watchlist);
    setWatchlist(next);
  }

  async function onMarkSeen(id: string) {
    const next = await markSeen(id, seen, watchlist);
    setSeen(next.seen);
    setWatchlist(next.watchlist);
    setDetail(null);
  }

  async function onUnmarkSeen(id: string) {
    const next = await unmarkSeen(id, seen);
    setSeen(next);
  }

  async function saveSettings() {
    try {
      setSaveMessage(null);
      const saved = await setApiBaseUrl(draftUrl);
      setApiUrlState(saved);
      setSettingsOpen(false);
      await load(false, saved);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : String(err));
    }
  }

  async function useGithubFeed() {
    try {
      setSaveMessage(null);
      const saved = await resetToDefaultFeed();
      setApiUrlState(saved);
      setDraftUrl(saved);
      setSettingsOpen(false);
      await load(false, saved);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : String(err));
    }
  }

  const fontsReady = bebasLoaded && dmLoaded;

  if (!hydrated || !fontsReady) {
    return (
      <View style={[styles.safe, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color="#E8C468" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1B1520", "#12141A", "#0C0E12"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>FILM RADAR</Text>
            <Text style={styles.subtitle}>
              Streaming novinky s ČSFD ≥ 70 %
            </Text>
            <Text style={styles.updated}>{formatUpdatedAt(updatedAt)}</Text>
          </View>
          <Pressable onPress={() => setSettingsOpen(true)} style={styles.gearBtn}>
            <Text style={styles.gearText}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(
            [
              ["discover", "Objevuj"],
              ["fresh", `Nové${freshCount ? ` · ${freshCount}` : ""}`],
              ["watchlist", `Watchlist${watchlist.length ? ` · ${watchlist.length}` : ""}`],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tab, tab === key && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chips}>
          {(
            [
              ["all", "Vše"],
              ["movie", "Filmy"],
              ["series", "Seriály"],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setTypeFilter(key)}
              style={[styles.chip, typeFilter === key && styles.chipActive]}
            >
              <Text style={[styles.chipText, typeFilter === key && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chips}>
          {(
            [
              ["all", "Všechny služby"],
              ["netflix", "Netflix"],
              ["disney", "Disney+"],
              ["oneplay", "Oneplay"],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setProviderFilter(key)}
              style={[styles.chip, providerFilter === key && styles.chipActive]}
            >
              <Text style={[styles.chipText, providerFilter === key && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#E8C468" size="large" style={{ marginTop: 48 }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Nejde načíst feed</Text>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.primaryBtn} onPress={useGithubFeed}>
            <Text style={styles.primaryBtnText}>Obnovit GitHub feed</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setSettingsOpen(true)}>
            <Text style={styles.secondaryBtnText}>Nastavení</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleTitles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {tab === "watchlist"
                  ? "Watchlist je prázdný"
                  : tab === "fresh"
                    ? "Žádné čerstvé novinky"
                    : "Nic k zobrazení"}
              </Text>
              <Text style={styles.empty}>
                {tab === "watchlist"
                  ? "Přidej tituly tlačítkem ★ u položky."
                  : tab === "fresh"
                    ? "Nové tituly se objeví po denním scanu na GitHubu."
                    : "Zkus jiný filtr, nebo stáhni seznam dolů."}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#E8C468"
            />
          }
          renderItem={({ item }) => {
            const onWatchlist = watchlist.includes(item.id);
            const fresh = isFresh(item.firstSeenAt);
            return (
              <Pressable style={styles.card} onPress={() => setDetail(item)}>
                <View style={styles.posterWrap}>
                  {item.posterUrl ? (
                    <Image source={{ uri: item.posterUrl }} style={styles.poster} />
                  ) : (
                    <View style={[styles.poster, styles.posterFallback]} />
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    style={styles.posterFade}
                  />
                  <View style={styles.ratingPill}>
                    <Text style={styles.ratingPillText}>{item.csfdRating ?? "—"}%</Text>
                  </View>
                  {fresh ? (
                    <View style={styles.newPill}>
                      <Text style={styles.newPillText}>NOVÉ</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.meta}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.metaLine}>
                    {item.year ?? "—"} · {item.type === "series" ? "Seriál" : "Film"}
                  </Text>
                  <View style={styles.badges}>
                    {(item.providers || []).map((p) => (
                      <View
                        key={p}
                        style={[
                          styles.badge,
                          { borderColor: PROVIDER_COLOR[p] ?? "#3A4150" },
                        ]}
                      >
                        <Text style={styles.badgeText}>{PROVIDER_LABEL[p] ?? p}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => onToggleWatch(item.id)}
                      style={[styles.actionBtn, onWatchlist && styles.actionBtnOn]}
                    >
                      <Text style={styles.actionText}>{onWatchlist ? "★ Ve watchlistu" : "☆ Watchlist"}</Text>
                    </Pressable>
                    <Pressable onPress={() => onMarkSeen(item.id)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>Viděl jsem</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={!!detail} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailCard}>
            {detail ? (
              <>
                <View style={styles.detailTop}>
                  {detail.posterUrl ? (
                    <Image source={{ uri: detail.posterUrl }} style={styles.detailPoster} />
                  ) : (
                    <View style={[styles.detailPoster, styles.posterFallback]} />
                  )}
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.detailTitle}>{detail.title}</Text>
                    <Text style={styles.metaLine}>
                      {detail.year ?? "—"} · {detail.type === "series" ? "Seriál" : "Film"}
                    </Text>
                    <Text style={styles.detailRating}>{detail.csfdRating ?? "—"} % ČSFD</Text>
                    <View style={styles.badges}>
                      {(detail.providers || []).map((p) => (
                        <View key={p} style={styles.badge}>
                          <Text style={styles.badgeText}>{PROVIDER_LABEL[p] ?? p}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => detail.csfdUrl && Linking.openURL(detail.csfdUrl)}
                >
                  <Text style={styles.primaryBtnText}>Otevřít na ČSFD</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => onToggleWatch(detail.id)}
                >
                  <Text style={styles.secondaryBtnText}>
                    {watchlist.includes(detail.id) ? "Odebrat z watchlistu" : "Přidat do watchlistu"}
                  </Text>
                </Pressable>
                {seen.includes(detail.id) ? (
                  <Pressable style={styles.secondaryBtn} onPress={() => onUnmarkSeen(detail.id)}>
                    <Text style={styles.secondaryBtnText}>Vrátit do Objevuj</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.secondaryBtn} onPress={() => onMarkSeen(detail.id)}>
                    <Text style={styles.secondaryBtnText}>Označit jako viděné</Text>
                  </Pressable>
                )}
                <Pressable style={styles.secondaryBtn} onPress={() => setDetail(null)}>
                  <Text style={styles.secondaryBtnText}>Zavřít</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={settingsOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Nastavení feedu</Text>
            <Text style={styles.empty}>
              Appka bere data přímo z GitHubu. Tlačítko níže nastaví správnou adresu
              (bez staré CDN cache).
            </Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://...."
              placeholderTextColor="#6B7280"
              value={draftUrl}
              onChangeText={setDraftUrl}
            />
            {saveMessage ? <Text style={styles.empty}>{saveMessage}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={useGithubFeed}>
              <Text style={styles.primaryBtnText}>Použít GitHub feed</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={saveSettings}>
              <Text style={styles.secondaryBtnText}>Uložit ruční adresu</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setSettingsOpen(false)}>
              <Text style={styles.secondaryBtnText}>Zavřít</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0C0E12", paddingTop: 52 },
  center: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  header: { paddingHorizontal: 18, paddingBottom: 10, gap: 12 },
  headerRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  brand: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 42,
    color: "#F7F1E8",
    letterSpacing: 1.5,
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    color: "#A8AFBD",
    fontSize: 14,
    marginTop: 2,
  },
  updated: {
    fontFamily: "DMSans_400Regular",
    color: "#6F7788",
    fontSize: 12,
    marginTop: 4,
  },
  gearBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  gearText: { color: "#E8C468", fontSize: 18 },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  tabActive: { borderBottomColor: "#E8C468" },
  tabText: {
    fontFamily: "DMSans_500Medium",
    color: "#8B92A1",
    fontSize: 13,
  },
  tabTextActive: { color: "#E8C468" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: {
    borderColor: "#E8C468",
    backgroundColor: "rgba(232,196,104,0.12)",
  },
  chipText: {
    fontFamily: "DMSans_500Medium",
    color: "#B7BCC8",
    fontSize: 12,
  },
  chipTextActive: { color: "#E8C468" },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 10,
  },
  posterWrap: { width: 92, height: 138, overflow: "hidden", position: "relative" },
  poster: { width: "100%", height: "100%", backgroundColor: "#1A1E27" },
  posterFallback: { backgroundColor: "#252A35" },
  posterFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
  },
  ratingPill: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "#E8C468",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingPillText: {
    fontFamily: "DMSans_700Bold",
    color: "#12141A",
    fontSize: 12,
  },
  newPill: {
    position: "absolute",
    left: 6,
    top: 6,
    backgroundColor: "#E07A6A",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  newPillText: {
    fontFamily: "DMSans_700Bold",
    color: "#fff",
    fontSize: 10,
    letterSpacing: 0.6,
  },
  meta: { flex: 1, justifyContent: "center", gap: 6 },
  title: {
    fontFamily: "DMSans_700Bold",
    color: "#F4F1EA",
    fontSize: 17,
    lineHeight: 22,
  },
  metaLine: {
    fontFamily: "DMSans_400Regular",
    color: "#8B92A1",
    fontSize: 13,
  },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    borderWidth: 1,
    borderColor: "#3A4150",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: "DMSans_500Medium",
    color: "#C5CAD6",
    fontSize: 11,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  actionBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  actionBtnOn: {
    borderColor: "#E8C468",
    backgroundColor: "rgba(232,196,104,0.12)",
  },
  actionText: {
    fontFamily: "DMSans_500Medium",
    color: "#E8E4DA",
    fontSize: 12,
  },
  emptyBox: { paddingTop: 48, paddingHorizontal: 12, gap: 8 },
  emptyTitle: {
    fontFamily: "DMSans_700Bold",
    color: "#F4F1EA",
    fontSize: 18,
    textAlign: "center",
  },
  empty: {
    fontFamily: "DMSans_400Regular",
    color: "#8B92A1",
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14,
  },
  errorTitle: {
    fontFamily: "DMSans_700Bold",
    color: "#F4F1EA",
    fontSize: 18,
  },
  error: {
    fontFamily: "DMSans_400Regular",
    color: "#E07A6A",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    alignSelf: "stretch",
    backgroundColor: "#E8C468",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "DMSans_700Bold",
    color: "#12141A",
    fontSize: 14,
  },
  secondaryBtn: {
    alignSelf: "stretch",
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: "DMSans_500Medium",
    color: "#B7BCC8",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  detailCard: {
    backgroundColor: "#151821",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  detailTop: { flexDirection: "row", gap: 14 },
  detailPoster: { width: 96, height: 144, backgroundColor: "#1A1E27" },
  detailTitle: {
    fontFamily: "DMSans_700Bold",
    color: "#F4F1EA",
    fontSize: 20,
    lineHeight: 26,
  },
  detailRating: {
    fontFamily: "DMSans_700Bold",
    color: "#E8C468",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0C0E12",
    color: "#F4F1EA",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
  },
});
