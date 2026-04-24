import React from "react";
import { Image, StyleSheet, type StyleProp, type ImageStyle } from "react-native";
import { useColorScheme } from "react-native";

const logoLight = require("../../../assets/images/logo.png");
const logoDark = require("../../../assets/images/logo-inverse.png");

interface LogoProps {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export function Logo({ width = 120, height = 40, style }: LogoProps) {
  const colorScheme = useColorScheme();
  const source = colorScheme === "dark" ? logoDark : logoLight;

  return (
    <Image
      source={source}
      style={[{ width, height }, styles.image, style]}
      resizeMode="contain"
      accessibilityLabel="Suliv"
      accessibilityRole="image"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "contain",
  },
});
