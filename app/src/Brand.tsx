import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { colors } from "./theme";

const FILTER_CHIP_H = 36;

const PROVIDER_META: Record<
  string,
  { short: string; label: string; tint: string }
> = {
  netflix: { short: "N", label: "Netflix", tint: "#B91C1C" },
  disney: { short: "D+", label: "Disney+", tint: "#2563EB" },
  oneplay: { short: "O", label: "Oneplay", tint: "#0E7490" },
};

/** Neutrální značka služby (ne oficiální logo). */
export function ProviderLogo({
  provider,
  size = 22,
}: {
  provider: string;
  size?: number;
}) {
  const meta = PROVIDER_META[provider];
  if (!meta) {
    return (
      <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.28 }]}>
        <Text style={[styles.badgeText, { fontSize: size * 0.42 }]}>?</Text>
      </View>
    );
  }
  const width = Math.round(size * (meta.short.length > 1 ? 1.35 : 1));
  return (
    <View
      style={[
        styles.badge,
        {
          width,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: meta.tint,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: size * 0.4 }]}>{meta.short}</Text>
    </View>
  );
}

export function ProviderMark({ provider }: { provider: string }) {
  return <ProviderLogo provider={provider} size={22} />;
}

/** Filtr služeb: textové chipy, bez oficiálních log. */
export function ProviderFilterChip({
  provider,
  label,
  active,
  onPress,
}: {
  provider: "all" | "netflix" | "disney" | "oneplay";
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      {provider !== "all" ? (
        <ProviderLogo provider={provider} size={18} />
      ) : null}
      <Text
        style={[
          styles.filterText,
          active ? styles.filterTextActive : styles.filterTextMuted,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BrandMark() {
  return (
    <Image
      source={require("../assets/radar-mark.png")}
      style={styles.brand}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#3A4150",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: "DMSans_700Bold",
    color: "#fff",
    letterSpacing: 0.2,
  },
  filterChip: {
    height: FILTER_CHIP_H,
    minWidth: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: 10,
    backgroundColor: colors.chip,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  filterText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
  },
  filterTextMuted: {
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.accent,
  },
  brand: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
});
