import { useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TitleItem } from "./types";

type Props = {
  children: React.ReactNode;
  onOpen: () => void;
  onDismiss: () => void;
};

/**
 * Přejetí zleva doprava = odstranit (skrýt) titul.
 */
export function SwipeDismissRow({ children, onOpen, onDismiss }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: () => {
        translateX.stopAnimation((v) => {
          startX.current = typeof v === "number" ? v : 0;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.max(0, startX.current + g.dx);
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 110 || g.vx > 0.7) {
          Animated.timing(translateX, {
            toValue: 420,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onDismiss());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const trashOpacity = translateX.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [0, 0.55, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.behind, { opacity: trashOpacity }]}>
        <Text style={styles.behindText}>Odstranit</Text>
      </Animated.View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...pan.panHandlers}
      >
        <Pressable onPress={onOpen}>{children}</Pressable>
      </Animated.View>
    </View>
  );
}

export function titleMetaLine(item: TitleItem): string {
  const kind =
    item.eventType === "new_season"
      ? `Nová řada${item.latestSeason ? ` ${item.latestSeason}` : ""}`
      : item.eventType === "new_series"
        ? "Nový seriál"
        : item.type === "series"
          ? "Seriál"
          : "Film";
  return `${item.year ?? "—"} · ${kind}`;
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
  },
  behind: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#8B3A3A",
    justifyContent: "center",
    paddingLeft: 22,
  },
  behindText: {
    color: "#fff",
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
  },
});
