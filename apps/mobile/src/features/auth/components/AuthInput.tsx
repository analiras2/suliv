import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { tokens } from "@suliv/design-system";

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
      <View style={[styles.inputRow, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={tokens.colors.textPrimary + "66"}
          secureTextEntry={isPassword && !visible}
          autoCorrect={false}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeBtn}
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            accessibilityRole="button"
          >
            <Text style={styles.eyeText}>{visible ? "🙈" : "👁"}</Text>
          </TouchableOpacity>
        )}
      </View>
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  inputNormal: {
    borderColor: "#D1D5DB",
  },
  inputError: {
    borderColor: tokens.colors.error,
  },
  input: {
    flex: 1,
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary,
    paddingVertical: tokens.spacing.md,
  },
  eyeBtn: {
    padding: tokens.spacing.xs,
  },
  eyeText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.error,
  },
});
