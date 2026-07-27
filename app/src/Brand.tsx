import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "./theme";

const PROVIDER_IMAGES: Record<
  string,
  { source: ImageSourcePropType; aspect: number }
> = {
  netflix: { source: require("../assets/provider-netflix.png"), aspect: 1 },
  disney: { source: require("../assets/provider-disney.png"), aspect: 2.15 },
  oneplay: { source: require("../assets/provider-oneplay.png"), aspect: 1.95 },
};

/** Ikona služby — oficiální loga Netflix / Disney+ / Oneplay. */
export function ProviderLogo({
  provider,
  size = 18,
}: {
  provider: string;
  size?: number;
}) {
  const spec = PROVIDER_IMAGES[provider];
  if (spec) {
    const h = size;
    const w = Math.round(size * spec.aspect);
    const radius = Math.round(Math.min(w, h) * 0.22);
    return (
      <Image
        source={spec.source}
        style={{ width: w, height: h, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <Text style={{ color: "#fff", fontSize: size * 0.5 }}>?</Text>
    </View>
  );
}

/** Logo u titulku na kartě — bez rámečku. */
export function ProviderMark({ provider }: { provider: string }) {
  const wide = provider === "disney" || provider === "oneplay";
  return <ProviderLogo provider={provider} size={wide ? 20 : 26} />;
}

/** Filtr služeb: chip jako u „Filmy / Seriály“, u služeb jen logo uvnitř. */
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
  const logoOnly = provider !== "all";
  const logoSize = provider === "netflix" ? 26 : 22;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.filterChip,
        logoOnly && styles.filterChipLogo,
        active && styles.filterChipActive,
      ]}
    >
      {logoOnly ? (
        <ProviderLogo provider={provider} size={logoSize} />
      ) : (
        <Text
          style={[
            styles.filterText,
            active ? styles.filterTextActive : styles.filterTextMuted,
          ]}
        >
          {label}
        </Text>
      )}
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
  fallback: {
    backgroundColor: "#3A4150",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 40,
  },
  filterChipLogo: {
    paddingHorizontal: 9,
    paddingVertical: 6,
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
