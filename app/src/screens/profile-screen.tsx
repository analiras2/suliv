import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Overline } from '@/components/atoms/overline';
import { SettingsRow } from '@/components/molecules/settings-row';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useProfileViewModel } from '@/module/profile/use-profile-view-model';

export function ProfileScreen() {
  const { name, settings } = useProfileViewModel();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Overline>você</Overline>
          <Text style={styles.title}>Oi, {name.toLowerCase()}</Text>
        </View>

        <View style={styles.card}>
          {settings.map((item, index) => (
            <SettingsRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              tone={item.tone}
              isLast={index === settings.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    gap: spacing.lg - 6,
    paddingBottom: layout.tabBarClearance,
  },
  header: {
    paddingHorizontal: spacing.lg - 4,
    paddingTop: spacing.sm + 2,
    gap: 4,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  card: {
    marginHorizontal: spacing.lg - 4,
    backgroundColor: semanticColors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md - 2,
    borderWidth: 1,
    borderColor: semanticColors.border,
  },
});
