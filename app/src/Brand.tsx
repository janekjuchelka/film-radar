import { Image, StyleSheet, Text, View } from "react-native";

const PROVIDER_STYLE: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  netflix: { bg: "#E50914", fg: "#FFFFFF", label: "N" },
  disney: { bg: "#113CCF", fg: "#FFFFFF", label: "D+" },
  oneplay: { bg: "#00C2A8", fg: "#041B18", label: "1" },
};

export function ProviderMark({ provider }: { provider: string }) {
  const s = PROVIDER_STYLE[provider] ?? {
    bg: "#3A4150",
    fg: "#fff",
    label: provider.slice(0, 1).toUpperCase(),
  };
  return (
    <View style={[styles.mark, { backgroundColor: s.bg }]}>
      <Text style={[styles.markText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

export function BrandMark() {
  return (
    <Image
      source={require("../assets/radar-mark.png")}
      style={styles.brand}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 11,
  },
  brand: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});
