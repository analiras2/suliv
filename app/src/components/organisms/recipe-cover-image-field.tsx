import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type RecipeCoverImageFieldProps = {
  imageUri: string | null;
  isMissing: boolean;
  onPickFromLibrary: () => void;
  onTakePhoto: () => void;
};

export function RecipeCoverImageField({ imageUri, isMissing, onPickFromLibrary, onTakePhoto }: RecipeCoverImageFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Foto de capa</Text>
      <View style={[styles.preview, isMissing && styles.previewMissing]} testID="recipe-form-cover-preview">
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
        ) : (
          <Icon name="leaf" size={28} color={colors.ink300} />
        )}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onPickFromLibrary}
          style={styles.actionButton}
          testID="recipe-form-pick-image">
          <Icon name="bookmark" size={16} color={semanticColors.fgBrand} />
          <Text style={styles.actionLabel}>Galeria</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onTakePhoto}
          style={styles.actionButton}
          testID="recipe-form-take-photo">
          <Icon name="sparkle" size={16} color={semanticColors.fgBrand} />
          <Text style={styles.actionLabel}>Câmera</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fgSecondary,
  },
  preview: {
    height: 160,
    borderRadius: radii.md,
    backgroundColor: semanticColors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewMissing: {
    borderWidth: 1,
    borderColor: semanticColors.danger,
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionLabel: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fgBrand,
  },
});
