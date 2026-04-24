import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

const P = tokens.color.primitive;

interface StepProgressBarProps {
  step: number;
  total: number;
  onBack: () => void;
}

export function StepProgressBar({ step, total, onBack }: StepProgressBarProps) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, height: 36 }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: P.ink[200], alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="chevron-back" size={20} color={P.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, color: P.ink[500], fontWeight: "500", fontFamily: tokens.typography.family.medium }}>
          {step + 1} <Text style={{ opacity: 0.5 }}>de {total}</Text>
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: P.ink[100], borderRadius: 999, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${((step + 1) / total) * 100}%`, backgroundColor: P.moss[500], borderRadius: 999 }} />
      </View>
    </View>
  );
}
