import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "@suliv/design-system";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Suliv</Text>
          <Text style={styles.subtitle}>Setup OK ✓</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.primary,
  },
  subtitle: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary,
  },
});
