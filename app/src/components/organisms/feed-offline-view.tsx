import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { semanticColors } from '@/design-system/tokens';

export function FeedOfflineView() {
  return (
    <SafeAreaView style={styles.safeArea} testID="feed-offline-view">
      <View style={styles.container}>
        <Text style={styles.message} testID="feed-offline-message">
          O feed não está disponível offline. Conecte-se à internet para ver suas receitas.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    color: semanticColors.fg,
    fontSize: 16,
    textAlign: 'center',
  },
});
