import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "./theme";

/** Ikona služby — Netflix N / Disney+ / Oneplay play. */
export function ProviderLogo({
  provider,
  size = 18,
}: {
  provider: string;
  size?: number;
}) {
  if (provider === "netflix") {
    return (
      <View
        style={[
          styles.netflixBox,
          { width: size, height: size, borderRadius: size * 0.18 },
        ]}
      >
        <Text style={[styles.netflixN, { fontSize: size * 0.72, lineHeight: size }]}>
          N
        </Text>
      </View>
    );
  }
  if (provider === "disney") {
    const h = size;
    const w = Math.round(size * 2.15);
    return (
      <Image
        source={require("../assets/provider-disney.png")}
        style={{ width: w, height: h, borderRadius: 4 }}
        resizeMode="contain"
      />
    );
  }
  if (provider === "oneplay") {
    return (
      <View style={[styles.oneplayBox, { width: size, height: size }]}>
        <View
          style={[
            styles.playTriangle,
            {
              borderTopWidth: size * 0.22,
              borderBottomWidth: size * 0.22,
              borderLeftWidth: size * 0.38,
            },
          ]}
        />
      </View>
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
  const wide = provider === "disney";
  return (
    <View style={[styles.markWrap, wide && styles.markWrapWide]}>
      <ProviderLogo provider={provider} size={wide ? 14 : 18} />
    </View>
  );
}

/** Chip ve filtru: logo + text. */
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
      style={[styles.filterInner, active && styles.filterInnerActive]}
    >
      {provider !== "all" ? (
        <ProviderLogo provider={provider} size={provider === "disney" ? 14 : 16} />
      ) : null}
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
  netflixBox: {
    backgroundColor: "#E50914",
    alignItems: "center",
    justifyContent: "center",
  },
  netflixN: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
  },
  oneplayBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
    marginLeft: 2,
  },
  fallback: {
    backgroundColor: "#3A4150",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  markWrap: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  markWrapWide: {
    minWidth: 44,
    paddingHorizontal: 6,
  },
  filterInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
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
