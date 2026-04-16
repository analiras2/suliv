import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { tokens } from "@suliv/design-system";

type ButtonVariant = "primary" | "outline" | "text";
type ButtonSize = "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === "md" ? styles.sizeMd : styles.sizeLg,
        fullWidth && styles.fullWidth,
        variant === "primary" && styles.primary,
        variant === "outline" && styles.outline,
        variant === "text" && styles.text,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? tokens.colors.surface : tokens.colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" ? styles.labelPrimary : styles.labelAccent,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.md,
  },
  sizeMd: {
    minHeight: 44,
    paddingHorizontal: tokens.space.lg,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: tokens.space.xl,
  },
  fullWidth: {
    width: "100%",
  },
  primary: {
    backgroundColor: tokens.color.semantic.brand.primary,
  },
  outline: {
    backgroundColor: tokens.color.semantic.surface.elevated,
    borderWidth: 1.5,
    borderColor: tokens.color.semantic.brand.primary,
  },
  text: {
    backgroundColor: "transparent",
    paddingHorizontal: tokens.space.xs,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: tokens.typography.scale.label.lg.fontSize,
    lineHeight: tokens.typography.scale.label.lg.lineHeight,
    fontWeight: tokens.typography.weight.semibold,
  },
  labelPrimary: {
    color: tokens.color.semantic.text.inverse,
  },
  labelAccent: {
    color: tokens.color.semantic.brand.primary,
  },
});
