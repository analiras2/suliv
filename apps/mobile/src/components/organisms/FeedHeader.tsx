import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";
import { Logo } from "../atoms/Logo";

const P = tokens.color.primitive;

interface FeedHeaderProps {
  onNotificationsPress?: () => void;
}

export function FeedHeader({ onNotificationsPress }: FeedHeaderProps) {
  return (
    <View style={styles.header}>
      <Logo width={120} height={58} />
      <Pressable
        onPress={onNotificationsPress}
        style={styles.bellBtn}
        accessibilityRole="button"
        accessibilityLabel="Notificações"
        hitSlop={8}
      >
        <MaterialCommunityIcons name="bell-outline" size={19} color={P.ink[700]} />
        <View style={styles.badge} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
    paddingBottom: tokens.space.xs,
    backgroundColor: tokens.color.semantic.surface.base,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.semantic.surface.elevated,
    borderWidth: 1,
    borderColor: tokens.color.semantic.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.clay[500],
    borderWidth: 1.5,
    borderColor: tokens.color.semantic.surface.elevated,
  },
});
