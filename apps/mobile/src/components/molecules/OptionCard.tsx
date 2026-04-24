import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";
import { GlyphIcon, type GlyphSpec } from "../atoms/GlyphIcon";

const P = tokens.color.primitive;

interface OptionCardProps {
  label: string;
  sub?: string;
  glyph: GlyphSpec;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
  tone?: "moss" | "clay";
}

export function OptionCard({
  label, sub, glyph, selected, onPress, multi = false, tone = "moss",
}: OptionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: "row", alignItems: "center", gap: 14, padding: 14,
        backgroundColor: selected ? P.moss[100] : P.white,
        borderWidth: 1.5, borderColor: selected ? P.moss[500] : P.ink[200],
        borderRadius: 18,
        ...tokens.elevation[selected ? "none" : "xs"],
      }}
    >
      <GlyphIcon glyph={glyph} selected={selected} tone={tone} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: selected ? P.moss[800] : P.ink[900], fontFamily: tokens.typography.family.semibold, lineHeight: 20 }}>
          {label}
        </Text>
        {!!sub && (
          <Text style={{ fontSize: 13, color: selected ? P.moss[700] : P.ink[500], marginTop: 2, fontFamily: tokens.typography.family.regular }}>
            {sub}
          </Text>
        )}
      </View>
      <View style={{
        width: 22, height: 22,
        borderRadius: multi ? 6 : 11,
        borderWidth: 1.5, borderColor: selected ? P.moss[500] : P.ink[200],
        backgroundColor: selected ? P.moss[500] : "transparent",
        alignItems: "center", justifyContent: "center",
      }}>
        {selected && <Ionicons name="checkmark" size={13} color={P.white} />}
      </View>
    </TouchableOpacity>
  );
}
