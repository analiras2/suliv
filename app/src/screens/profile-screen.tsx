import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/molecules/avatar';
import { Overline } from '@/components/atoms/overline';
import { SettingsRow } from '@/components/molecules/settings-row';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useProfileViewModel } from '@/module/profile/use-profile-view-model';

export function ProfileScreen() {
  const { avatarUrl, error, isLoading, isWorking, name, settings, username } = useProfileViewModel();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loading]} edges={['top']}>
        <ActivityIndicator color={semanticColors.brand} testID="profile-loading" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Overline>você</Overline>
          <View style={styles.headerRow}>
            <Avatar avatarUrl={avatarUrl} name={name || null} username={username} />
            <Text style={styles.title} testID="profile-greeting">Oi, {name.toLocaleLowerCase('pt-BR')}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.card}>
          {settings.map((item, index) => (
            <SettingsRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              tone={item.tone}
              onPress={isWorking ? undefined : item.onPress}
              testID={item.testID}
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
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.lg - 6,
    paddingBottom: layout.tabBarClearance,
  },
  header: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.sm + 2,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  error: {
    ...typography.bodyMd,
    color: semanticColors.danger,
  },
  card: {
    marginHorizontal: layout.screenGutter,
    backgroundColor: semanticColors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md - 2,
    borderWidth: 1,
    borderColor: semanticColors.border,
  },
});
