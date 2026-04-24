import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tokens } from "@suliv/design-system";

const P = tokens.color.primitive;

export type FeedTab = "feed" | "search" | "favorites" | "profile";

interface TabItem {
  id: FeedTab;
  label: string;
  iconActive: string;
  iconDefault: string;
}

const TABS: TabItem[] = [
  { id: "feed",      label: "Feed",      iconActive: "home",          iconDefault: "home-outline" },
  { id: "search",    label: "Busca",     iconActive: "magnify",       iconDefault: "magnify" },
  { id: "favorites", label: "Favoritos", iconActive: "heart",         iconDefault: "heart-outline" },
  { id: "profile",   label: "Perfil",    iconActive: "account",       iconDefault: "account-outline" },
];

interface BottomNavProps {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, tokens.space.sm) }]}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <MaterialCommunityIcons
              name={(isActive ? tab.iconActive : tab.iconDefault) as any}
              size={22}
              color={isActive ? P.moss[700] : P.ink[500]}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    backgroundColor: "rgba(250,246,237,0.96)",
    borderTopWidth: 1,
    borderTopColor: tokens.color.semantic.border.subtle,
    paddingTop: tokens.space.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: tokens.space.xs,
    paddingVertical: tokens.space["2xs"],
  },
  label: {
    fontSize: 10.5,
    fontFamily: tokens.typography.family.medium,
    fontWeight: "500",
    color: P.ink[500],
  },
  labelActive: {
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    color: P.moss[700],
  },
});
