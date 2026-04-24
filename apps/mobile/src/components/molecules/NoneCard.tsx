import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

const P = tokens.color.primitive;

interface NoneCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function NoneCard({ label, selected, onPress }: NoneCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        padding: 14, backgroundColor: selected ? P.ink[900] : "transparent",
        borderWidth: 1.5, borderStyle: "dashed", borderColor: selected ? P.ink[900] : P.ink[300],
        borderRadius: 18,
      }}
    >
      {selected && <Ionicons name="checkmark" size={16} color={P.sand[25]} />}
      <Text style={{ fontSize: 15, fontWeight: "600", color: selected ? P.sand[25] : P.ink[700], fontFamily: tokens.typography.family.semibold }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
