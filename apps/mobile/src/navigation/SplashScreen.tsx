import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Suliv</Text>
      <ActivityIndicator
        size="large"
        color={tokens.colors.primary}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.xl,
  },
  logo: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.primary,
  },
  spinner: {
    marginTop: tokens.spacing.sm,
  },
});
