import React, { type ReactNode } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { tokens } from "@suliv/design-system";

interface InputProps extends TextInputProps {
  error?: boolean;
  rightAccessory?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  error = false,
  rightAccessory,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <View
      style={[
        styles.container,
        error ? styles.error : styles.normal,
        containerStyle,
      ]}
    >
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={tokens.color.semantic.text.secondary}
        autoCorrect={false}
        autoCapitalize="none"
        {...props}
      />
      {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.semantic.surface.elevated,
    paddingHorizontal: tokens.space.md,
    minHeight: 52,
  },
  normal: {
    borderColor: tokens.color.semantic.border.default,
  },
  error: {
    borderColor: tokens.color.semantic.feedback.error,
  },
  input: {
    flex: 1,
    fontSize: tokens.typography.scale.body.md.fontSize,
    lineHeight: tokens.typography.scale.body.md.lineHeight,
    color: tokens.color.semantic.text.primary,
    paddingVertical: tokens.space.sm,
  },
  accessory: {
    marginLeft: tokens.space.xs,
  },
});
