import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
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
import { DEFAULT_API_BASE_URL, getApiBaseUrl, resetToDefaultFeed, setApiBaseUrl, titlesUrlFromBase } from "./src/config";
import type { TitleItem } from "./src/types";

const PROVIDER_LABEL: Record<string, string> = {
  netflix: "Netflix",
  disney: "Disney+",
  oneplay: "Oneplay",
};

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "series">("all");
  const [apiUrl, setApiUrlState] = useState(DEFAULT_API_BASE_URL);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_API_BASE_URL);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await getApiBaseUrl();
      if (cancelled) return;
      setApiUrlState(url);
      setDraftUrl(url);
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
        let url = titlesUrlFromBase(baseUrl);
        if (!url.endsWith(".json")) {
          const sep = url.includes("?") ? "&" : "?";
          url = `${url}${sep}minRating=70`;
          if (typeFilter !== "all") url += `&type=${typeFilter}`;
        }
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("HTTP " + res.status + "\nURL: " + url);
        const data = await res.json();
        let list = Array.isArray(data.titles) ? data.titles : [];
        if (url.endsWith(".json") && typeFilter !== "all") {
          list = list.filter((t: { type?: string }) => t.type === typeFilter);
        }
        if (!list.length && !Array.isArray(data.titles)) {
          throw new Error("Neplatná odpověď serveru\nURL: " + url);
        }
        setTitles(list);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message + "\nAPI: " + baseUrl);
        setTitles([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiUrl, typeFilter]
  );

  useEffect(() => {
    if (!hydrated) return;
    load(false, apiUrl);
  }, [hydrated, apiUrl, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveSettings() {
    try {
      setSaveMessage(null);
      const saved = await setApiBaseUrl(draftUrl);
      setApiUrlState(saved);
      setSaveMessage("Uloženo");
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
      setSaveMessage("Nastaven GitHub feed");
      setSettingsOpen(false);
      await load(false, saved);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : String(err));
    }
  }

  if (!hydrated) {
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
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>Film Radar</Text>
          <Pressable onPress={() => setSettingsOpen(true)} style={styles.settingsBtn}>
            <Text style={styles.settingsBtnText}>Nastavení</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Novinky ≥ 70 % na ČSFD</Text>
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
      </View>

      {loading ? (
        <ActivityIndicator color="#E8C468" size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => setSettingsOpen(true)}>
            <Text style={styles.retryText}>Otevřít nastavení</Text>
          </Pressable>
          <Pressable style={styles.retrySecondary} onPress={() => load(false)}>
            <Text style={styles.retrySecondaryText}>Zkusit znovu</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={titles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Zatím žádné tituly. Spusť scan na serveru.</Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#E8C468"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                if (item.csfdUrl) Linking.openURL(item.csfdUrl);
              }}
            >
              {item.posterUrl ? (
                <Image source={{ uri: item.posterUrl }} style={styles.poster} />
              ) : (
                <View style={[styles.poster, styles.posterFallback]} />
              )}
              <View style={styles.meta}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.year}>
                  {item.year ?? "—"} · {item.type === "series" ? "Seriál" : "Film"}
                </Text>
                <Text style={styles.rating}>{item.csfdRating} % ČSFD</Text>
                <View style={styles.badges}>
                  {(item.providers || []).map((p) => (
                    <View key={p} style={styles.badge}>
                      <Text style={styles.badgeText}>{PROVIDER_LABEL[p] ?? p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal visible={settingsOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adresa feedu</Text>
            <Text style={styles.modalHint}>
              Stálá GitHub adresa (soubor titles.json). Ulož jednou — appka si ji pamatuje.
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
            {saveMessage ? <Text style={styles.modalHint}>{saveMessage}</Text> : null}
            <Pressable style={styles.retry} onPress={useGithubFeed}>
              <Text style={styles.retryText}>Použít GitHub feed</Text>
            </Pressable>
            <Pressable style={styles.retrySecondary} onPress={saveSettings}>
              <Text style={styles.retrySecondaryText}>Uložit ruční adresu</Text>
            </Pressable>
            <Pressable style={styles.retrySecondary} onPress={() => setSettingsOpen(false)}>
              <Text style={styles.retrySecondaryText}>Zavřít</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#12141A", paddingTop: 48 },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { fontSize: 34, fontWeight: "700", color: "#F4F1EA", flexShrink: 1 },
  settingsBtn: {
    borderWidth: 1,
    borderColor: "#2A2F3A",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#1A1E27",
  },
  settingsBtnText: { color: "#E8C468", fontSize: 13, fontWeight: "600" },
  subtitle: { color: "#9AA0AE", fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1,
    borderColor: "#2A2F3A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#1A1E27",
  },
  chipActive: { borderColor: "#E8C468", backgroundColor: "#2A2416" },
  chipText: { color: "#B7BCC8", fontSize: 13 },
  chipTextActive: { color: "#E8C468", fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2F3A",
  },
  poster: { width: 72, height: 108, backgroundColor: "#1A1E27" },
  posterFallback: { backgroundColor: "#252A35" },
  meta: { flex: 1, justifyContent: "center", gap: 4 },
  title: { color: "#F4F1EA", fontSize: 17, fontWeight: "600" },
  year: { color: "#8B92A1", fontSize: 13 },
  rating: { color: "#E8C468", fontSize: 15, fontWeight: "700", marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  badge: { backgroundColor: "#252A35", paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: "#C5CAD6", fontSize: 11, fontWeight: "600" },
  empty: { color: "#8B92A1", textAlign: "center", marginTop: 40, lineHeight: 22 },
  center: { paddingHorizontal: 16, gap: 16, marginTop: 24, justifyContent: "center" },
  error: { color: "#E07A6A", textAlign: "center", lineHeight: 22 },
  retry: {
    alignSelf: "center",
    backgroundColor: "#E8C468",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: "#12141A", fontWeight: "700" },
  retrySecondary: { alignSelf: "center", paddingVertical: 8 },
  retrySecondaryText: { color: "#B7BCC8", fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#1A1E27",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2F3A",
  },
  modalTitle: { color: "#F4F1EA", fontSize: 20, fontWeight: "700" },
  modalHint: { color: "#9AA0AE", fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#2A2F3A",
    backgroundColor: "#12141A",
    color: "#F4F1EA",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
});
