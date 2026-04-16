import {
  StyleSheet,
  Text,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";
import { Input } from "../../../components/atoms/Input";

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function AuthInput({ label, error, isPassword, ...props }: AuthInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Input
        error={Boolean(error)}
        secureTextEntry={isPassword && !visible}
        rightAccessory={
          isPassword ? (
            <TouchableOpacity
              onPress={() => setVisible((v) => !v)}
              style={styles.eyeBtn}
              accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name={visible ? "eye-off" : "eye"}
                size={20}
                color={tokens.color.semantic.text.secondary}
              />
            </TouchableOpacity>
          ) : null
        }
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.xs,
  },
  label: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.medium,
    color: tokens.colors.textPrimary,
  },
  eyeBtn: {
    padding: tokens.spacing.xs,
  },
  errorText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.error,
  },
});
