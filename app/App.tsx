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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandMark, ProviderFilterChip, ProviderMark } from "./src/Brand";
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
  hideTitleForever,
  isFresh,
  loadLibrary,
  markSeen,
  toggleWatchlist,
  unmarkSeen,
} from "./src/library";
import {
  SwipeDismissRow,
  eventPill,
  titleMetaLine,
} from "./src/SwipeDismissRow";
import { colors } from "./src/theme";
import type { ProviderFilter, TitleItem, TitleTypeFilter } from "./src/types";

type TabKey = "discover" | "fresh" | "watchlist";

const BOTTOM_SAFE = 40;

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
  const [hidden, setHidden] = useState<string[]>([]);

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
      setHidden(library.hidden);
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
        if (!Array.isArray(data.titles)) {
          throw new Error("Neplatná odpověď feedu\nURL: " + url);
        }
        setTitles(data.titles as TitleItem[]);
        setUpdatedAt(data.updatedAt ?? data.meta?.lastScanAt ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
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
    let list = titles.filter((t) => !hidden.includes(t.id));
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (providerFilter !== "all") {
      list = list.filter((t) => t.providers?.includes(providerFilter));
    }
    if (tab === "fresh") {
      list = list.filter(
        (t) => isFresh(t.eventAt ?? t.firstSeenAt) && !seen.includes(t.id)
      );
    } else if (tab === "watchlist") {
      list = list.filter((t) => watchlist.includes(t.id));
    } else {
      list = list.filter((t) => !seen.includes(t.id));
    }
    return list;
  }, [titles, typeFilter, providerFilter, tab, seen, watchlist, hidden]);

  const freshCount = useMemo(
    () =>
      titles.filter(
        (t) =>
          !hidden.includes(t.id) &&
          isFresh(t.eventAt ?? t.firstSeenAt) &&
          !seen.includes(t.id)
      ).length,
    [titles, seen, hidden]
  );

  async function onToggleWatch(id: string) {
    setWatchlist(await toggleWatchlist(id, watchlist));
  }

  async function onMarkSeen(id: string) {
    const next = await markSeen(id, seen, watchlist);
    setSeen(next.seen);
    setWatchlist(next.watchlist);
    setDetail(null);
  }

  async function onUnmarkSeen(id: string) {
    setSeen(await unmarkSeen(id, seen));
  }

  async function onDismiss(id: string) {
    setHidden((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setWatchlist((prev) => prev.filter((x) => x !== id));
    if (detail?.id === id) setDetail(null);
    try {
      const next = await hideTitleForever(id);
      setHidden(next.hidden);
      setWatchlist(next.watchlist);
    } catch {
      // keep optimistic hide
    }
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

  if (!hydrated || !(bebasLoaded && dmLoaded)) {
    return (
      <View style={[styles.safe, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <BrandMark />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.brandLine} numberOfLines={1}>
              <Text style={styles.brandFilm}>FILM </Text>
              <Text style={styles.brandRadar}>RADAR</Text>
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => load(true)}
              style={styles.iconBtn}
              disabled={refreshing || loading}
            >
              <Text style={styles.iconBtnText}>{refreshing ? "…" : "↻"}</Text>
            </Pressable>
            <Pressable onPress={() => setSettingsOpen(true)} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>⚙</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          Novinky · ČSFD ≥ 70 %
        </Text>
        <Text style={styles.updated} numberOfLines={1}>
          {formatUpdatedAt(updatedAt)}
        </Text>

        <View style={styles.tabs}>
          {(
            [
              ["discover", "OBJEVUJ", null as number | null],
              ["fresh", "NOVÉ", freshCount || null],
              ["watchlist", "WATCHLIST", watchlist.length || null],
            ] as const
          ).map(([key, label, count]) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <View style={styles.tabInner}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {label}
                  </Text>
                  {count ? (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chipWrap}>
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

        <View style={styles.chipWrap}>
          <ProviderFilterChip
            provider="all"
            label="Vše"
            active={providerFilter === "all"}
            onPress={() => setProviderFilter("all")}
          />
          <ProviderFilterChip
            provider="netflix"
            label="Netflix"
            active={providerFilter === "netflix"}
            onPress={() => setProviderFilter("netflix")}
          />
          <ProviderFilterChip
            provider="disney"
            label="Disney+"
            active={providerFilter === "disney"}
            onPress={() => setProviderFilter("disney")}
          />
          <ProviderFilterChip
            provider="oneplay"
            label="Oneplay"
            active={providerFilter === "oneplay"}
            onPress={() => setProviderFilter("oneplay")}
          />
        </View>

        <Text style={styles.hint} numberOfLines={1}>
          ↪ Přejeď zleva doprava = smazat natrvalo
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 48 }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Nejde načíst feed</Text>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.primaryBtn} onPress={useGithubFeed}>
            <Text style={styles.primaryBtnText}>Obnovit GitHub feed</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleTitles}
          extraData={hidden}
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
                  ? "Přidej tituly tlačítkem Watchlist."
                  : "Klepni ↻ nahoře, nebo změň filtr."}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => {
            const onWatchlist = watchlist.includes(item.id);
            const pill = eventPill(item);
            return (
              <SwipeDismissRow
                onOpen={() => setDetail(item)}
                onDismiss={() => onDismiss(item.id)}
              >
                <View style={styles.card}>
                  <View style={styles.posterWrap}>
                    {item.posterUrl ? (
                      <Image source={{ uri: item.posterUrl }} style={styles.poster} />
                    ) : (
                      <View style={[styles.poster, styles.posterFallback]} />
                    )}
                    {pill ? (
                      <View style={styles.typePill}>
                        <Text style={styles.typePillText}>{pill}</Text>
                      </View>
                    ) : null}
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingStar}>★</Text>
                      <Text style={styles.ratingPillText}>{item.csfdRating ?? "—"}%</Text>
                    </View>
                  </View>

                  <View style={styles.meta}>
                    <View style={styles.metaTop}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.title} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.metaLine}>{titleMetaLine(item)}</Text>
                      </View>
                      <Pressable onPress={() => setDetail(item)} hitSlop={10}>
                        <Text style={styles.more}>⋮</Text>
                      </Pressable>
                    </View>

                    <View style={styles.providerRow}>
                      {(item.providers || []).slice(0, 3).map((p) => (
                        <ProviderMark key={p} provider={p} />
                      ))}
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => onToggleWatch(item.id)}
                        style={[styles.outlineBtn, onWatchlist && styles.outlineBtnOn]}
                      >
                        <Text
                          style={[
                            styles.outlineBtnText,
                            onWatchlist && styles.outlineBtnTextOn,
                          ]}
                        >
                          {onWatchlist ? "★ Watchlist" : "Watchlist"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onMarkSeen(item.id)}
                        style={styles.filledBtn}
                      >
                        <Text style={styles.filledBtnText}>Viděl jsem</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </SwipeDismissRow>
            );
          }}
        />
      )}

      <Modal visible={!!detail} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { paddingBottom: 16 + BOTTOM_SAFE }]}>
            {detail ? (
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.detailTop}>
                  {detail.posterUrl ? (
                    <Image source={{ uri: detail.posterUrl }} style={styles.detailPoster} />
                  ) : (
                    <View style={[styles.detailPoster, styles.posterFallback]} />
                  )}
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.detailTitle}>{detail.title}</Text>
                    <Text style={styles.metaLine}>{titleMetaLine(detail)}</Text>
                    <Text style={styles.detailRating}>
                      ★ {detail.csfdRating ?? "—"} % ČSFD
                    </Text>
                    <View style={styles.providerRow}>
                      {(detail.providers || []).map((p) => (
                        <ProviderMark key={p} provider={p} />
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
                <Pressable style={styles.secondaryBtn} onPress={() => onToggleWatch(detail.id)}>
                  <Text style={styles.secondaryBtnText}>
                    {watchlist.includes(detail.id)
                      ? "Odebrat z watchlistu"
                      : "Přidat do watchlistu"}
                  </Text>
                </Pressable>
                {seen.includes(detail.id) ? (
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => onUnmarkSeen(detail.id)}
                  >
                    <Text style={styles.secondaryBtnText}>Vrátit do Objevuj</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.secondaryBtn} onPress={() => onMarkSeen(detail.id)}>
                    <Text style={styles.secondaryBtnText}>Označit jako viděné</Text>
                  </Pressable>
                )}
                <Pressable style={styles.dangerBtn} onPress={() => onDismiss(detail.id)}>
                  <Text style={styles.dangerBtnText}>Smazat natrvalo</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => setDetail(null)}>
                  <Text style={styles.secondaryBtnText}>Zavřít</Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={settingsOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { paddingBottom: 16 + BOTTOM_SAFE }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.detailTitle}>Nastavení feedu</Text>
            <Text style={styles.empty}>
              Data jdou z GitHubu. Ruční aktualizace: tlačítko ↻ nahoře.
            </Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://...."
              placeholderTextColor={colors.textDim}
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
  safe: { flex: 1, backgroundColor: colors.bg, paddingTop: 52 },
  center: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  header: { paddingHorizontal: 12, paddingBottom: 6, gap: 8 },
  headerRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  headerActions: { flexDirection: "row", gap: 6 },
  brandLine: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 30,
    letterSpacing: 1,
    lineHeight: 32,
  },
  brandFilm: { color: colors.text },
  brandRadar: { color: colors.accent },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    color: colors.textMuted,
    fontSize: 12,
  },
  updated: {
    fontFamily: "DMSans_400Regular",
    color: colors.textDim,
    fontSize: 11,
    marginTop: -2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { color: colors.accent, fontSize: 16 },
  tabs: { flexDirection: "row", gap: 2 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  tabActive: { borderBottomColor: colors.accent },
  tabInner: { flexDirection: "row", alignItems: "center", gap: 5 },
  tabText: {
    fontFamily: "DMSans_700Bold",
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  tabTextActive: { color: colors.accent },
  tabBadge: {
    backgroundColor: colors.accent,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    fontFamily: "DMSans_700Bold",
    color: "#fff",
    fontSize: 9,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: colors.chipBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.chip,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    fontFamily: "DMSans_500Medium",
    color: colors.textMuted,
    fontSize: 12,
  },
  chipTextActive: { color: colors.accent },
  hint: {
    fontFamily: "DMSans_400Regular",
    color: colors.textDim,
    fontSize: 11,
  },
  list: { paddingHorizontal: 12, paddingBottom: 36, gap: 10 },
  card: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 8,
  },
  posterWrap: {
    width: 84,
    height: 126,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1A1E27",
  },
  poster: { width: "100%", height: "100%" },
  posterFallback: { backgroundColor: "#252A35" },
  typePill: {
    position: "absolute",
    left: 6,
    top: 6,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typePillText: {
    fontFamily: "DMSans_700Bold",
    color: "#fff",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  ratingPill: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingStar: { color: colors.rating, fontSize: 11 },
  ratingPillText: {
    fontFamily: "DMSans_700Bold",
    color: "#fff",
    fontSize: 11,
  },
  meta: { flex: 1, justifyContent: "space-between", gap: 8 },
  metaTop: { flexDirection: "row", gap: 6 },
  title: {
    fontFamily: "DMSans_700Bold",
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
  },
  metaLine: {
    fontFamily: "DMSans_400Regular",
    color: colors.textMuted,
    fontSize: 13,
  },
  more: {
    color: colors.textDim,
    fontSize: 22,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  providerRow: { flexDirection: "row", gap: 6 },
  actions: { flexDirection: "row", gap: 8 },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  outlineBtnOn: { backgroundColor: colors.accentSoft },
  outlineBtnText: {
    fontFamily: "DMSans_700Bold",
    color: colors.accent,
    fontSize: 12,
  },
  outlineBtnTextOn: { color: colors.accent },
  filledBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
  },
  filledBtnText: {
    fontFamily: "DMSans_700Bold",
    color: "#fff",
    fontSize: 12,
  },
  emptyBox: { paddingTop: 48, paddingHorizontal: 12, gap: 8 },
  emptyTitle: {
    fontFamily: "DMSans_700Bold",
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
  },
  empty: {
    fontFamily: "DMSans_400Regular",
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14,
  },
  errorTitle: {
    fontFamily: "DMSans_700Bold",
    color: colors.text,
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
    backgroundColor: colors.accent,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "DMSans_700Bold",
    color: "#fff",
    fontSize: 14,
  },
  secondaryBtn: {
    alignSelf: "stretch",
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: "DMSans_500Medium",
    color: colors.textMuted,
    fontSize: 14,
  },
  dangerBtn: {
    alignSelf: "stretch",
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(185,28,28,0.5)",
    borderRadius: 14,
  },
  dangerBtnText: {
    fontFamily: "DMSans_500Medium",
    color: "#F87171",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
    maxHeight: "88%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 6,
  },
  detailTop: { flexDirection: "row", gap: 14 },
  detailPoster: {
    width: 96,
    height: 144,
    borderRadius: 12,
    backgroundColor: "#1A1E27",
  },
  detailTitle: {
    fontFamily: "DMSans_700Bold",
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
  },
  detailRating: {
    fontFamily: "DMSans_700Bold",
    color: colors.rating,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.bg,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
  },
});
