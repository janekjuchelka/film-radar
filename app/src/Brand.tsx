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

/** Filtr služeb: jen logo (nebo text „Vše“). */
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
  const logoSize = provider === "netflix" ? 30 : provider === "all" ? 0 : 26;

  if (logoOnly) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={styles.filterLogoHit}
        hitSlop={6}
      >
        <View style={[styles.filterLogo, !active && styles.filterLogoDim]}>
          <ProviderLogo provider={provider} size={logoSize} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.filterInner, active && styles.filterInnerActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
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
  fallback: {
    backgroundColor: "#3A4150",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  filterLogoHit: {
    justifyContent: "center",
    alignItems: "center",
  },
  filterLogo: {
    opacity: 1,
  },
  filterLogoDim: {
    opacity: 0.42,
  },
  filterInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 40,
  },
  filterInnerActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  filterText: {
    fontFamily: "DMSans_500Medium",
    color: colors.text,
    fontSize: 12,
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
