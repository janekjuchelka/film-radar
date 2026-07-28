import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "./theme";

const FILTER_CHIP_H = 36;

const PROVIDER_IMAGES: Record<
  string,
  { source: ImageSourcePropType; aspect: number }
> = {
  netflix: { source: require("../assets/provider-netflix.png"), aspect: 1 },
  disney: { source: require("../assets/provider-disney.png"), aspect: 2.15 },
  oneplay: { source: require("../assets/provider-oneplay.png"), aspect: 1.95 },
};

function filterChipLogoFrame(provider: string) {
  const spec = PROVIDER_IMAGES[provider];
  if (!spec) return null;
  const h = FILTER_CHIP_H;
  const w = Math.round(h * spec.aspect);
  const radius = Math.round(h * 0.2);
  return { w, h, radius, source: spec.source };
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

/** Filtr služeb: logo na celou plochu obrysu, nebo text „Vše“. */
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
  const frame = filterChipLogoFrame(provider);

  if (frame) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[
          styles.filterLogoFrame,
          {
            width: frame.w,
            height: frame.h,
            borderRadius: frame.radius,
          },
          active && styles.filterLogoFrameActive,
        ]}
      >
        <Image
          source={frame.source}
          style={{ width: frame.w, height: frame.h }}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.filterChipAll,
        active && styles.filterChipAllActive,
      ]}
    >
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
  fallback: {
    backgroundColor: "#3A4150",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  filterLogoFrame: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.chipBorder,
    padding: 0,
  },
  filterLogoFrameActive: {
    borderColor: colors.accent,
  },
  filterChipAll: {
    height: FILTER_CHIP_H,
    minWidth: 52,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: 10,
    backgroundColor: colors.chip,
  },
  filterChipAllActive: {
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
