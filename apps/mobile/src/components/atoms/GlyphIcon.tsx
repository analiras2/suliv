import { View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

const P = tokens.color.primitive;

export type GlyphSpec = { lib: "ion" | "mci"; name: string };

interface GlyphIconProps {
  glyph: GlyphSpec;
  selected: boolean;
  tone?: "moss" | "clay";
}

export function GlyphIcon({ glyph, selected, tone = "moss" }: GlyphIconProps) {
  const color = tone === "clay"
    ? (selected ? P.clay[700] : P.clay[500])
    : (selected ? P.moss[700] : P.moss[500]);
  const bg = selected ? P.white : (tone === "clay" ? P.clay[100] : P.sand[100]);

  return (
    <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      {glyph.lib === "ion"
        ? <Ionicons name={glyph.name as any} size={28} color={color} />
        : <MaterialCommunityIcons name={glyph.name as any} size={28} color={color} />}
    </View>
  );
}
