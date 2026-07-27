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

function isWideProvider(provider: string) {
  return provider === "disney" || provider === "oneplay";
}

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
    return (
      <Image
        source={spec.source}
        style={{ width: w, height: h, borderRadius: 4 }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <Text style={{ color: "#fff", fontSize: size * 0.5 }}>?</Text>
    </View>
  );
}

/** Malý badge na kartě. */
export function ProviderMark({ provider }: { provider: string }) {
  const wide = isWideProvider(provider);
  return (
    <View style={[styles.markWrap, wide && styles.markWrapWide]}>
      <ProviderLogo provider={provider} size={wide ? 18 : 22} />
    </View>
  );
}

/** Chip ve filtru: u služeb jen logo, u „Vše“ text. */
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
  const logoSize = provider === "netflix" ? 28 : provider === "all" ? 0 : 24;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.filterInner,
        logoOnly && styles.filterInnerLogo,
        active && styles.filterInnerActive,
      ]}
    >
      {logoOnly ? (
        <ProviderLogo provider={provider} size={logoSize} />
      ) : (
        <Text style={[styles.filterText, active && styles.filterTextActive]}>
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
  markWrap: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  markWrapWide: {
    minWidth: 58,
    paddingHorizontal: 8,
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
    minHeight: 44,
  },
  filterInnerLogo: {
    paddingHorizontal: 10,
    paddingVertical: 7,
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
