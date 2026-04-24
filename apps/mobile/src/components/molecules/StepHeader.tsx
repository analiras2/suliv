import { View, Text } from "react-native";
import { tokens } from "@suliv/design-system";

const P = tokens.color.primitive;

interface StepHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
}

export function StepHeader({ kicker, title, subtitle }: StepHeaderProps) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1.54, textTransform: "uppercase", color: P.moss[600], marginBottom: 8, fontFamily: tokens.typography.family.semibold }}>
        {kicker}
      </Text>
      <Text style={{ fontSize: 28, lineHeight: 32, color: P.ink[900], letterSpacing: -0.5, fontWeight: "500", fontFamily: tokens.typography.family.displayMedium, marginBottom: 8 }}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={{ fontSize: 14.5, color: P.ink[500], lineHeight: 21, fontFamily: tokens.typography.family.regular }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
