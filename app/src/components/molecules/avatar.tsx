import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, semanticColors, typography } from '@/design-system/tokens';

export type AvatarProps = {
  avatarUrl: string | null;
  name: string | null;
  username: string;
  size?: number;
  testID?: string;
};

function computeInitials(name: string | null, username: string): string {
  const source = name?.trim() ? name.trim() : username;
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}

export function Avatar({ avatarUrl, name, username, size = 56, testID }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return (
      <Image
        accessibilityLabel="Foto de perfil"
        source={{ uri: avatarUrl }}
        style={[styles.image, dimensionStyle]}
        testID={testID ?? 'avatar-photo'}
      />
    );
  }

  return (
    <View style={[styles.initials, dimensionStyle]} testID={testID ?? 'avatar-initials'}>
      <Text style={styles.initialsText}>{computeInitials(name, username)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: semanticColors.bgSubtle,
  },
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.moss100,
  },
  initialsText: {
    ...typography.labelLg,
    fontFamily: fontFamilies.sansMedium,
    color: colors.moss700,
  },
});
