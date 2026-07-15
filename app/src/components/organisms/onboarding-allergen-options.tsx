import { Pressable, StyleSheet, View } from 'react-native';

import { Pill } from '@/components/atoms/pill';
import { spacing } from '@/design-system/tokens';
import type { ApprovedAllergen } from '@/module/onboarding/services/onboarding-service';

export type OnboardingAllergenOptionsProps = {
  allergens: ApprovedAllergen[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  canAddNewTerm: boolean;
  onAddNewTerm: () => void;
};

export function OnboardingAllergenOptions({
  allergens,
  selectedIds,
  onToggle,
  canAddNewTerm,
  onAddNewTerm,
}: OnboardingAllergenOptionsProps) {
  return (
    <View style={styles.options}>
      {allergens.map((allergen) => {
        const isSelected = selectedIds.includes(allergen.id);
        return (
          <Pressable
            accessibilityLabel={allergen.name}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={allergen.id}
            onPress={() => onToggle(allergen.id)}
            testID={`onboarding-allergy-option-${allergen.id}`}>
            <Pill tone={isSelected ? 'moss' : 'sand'} size="md">
              {allergen.name}
            </Pill>
          </Pressable>
        );
      })}
      {canAddNewTerm && (
        <Pressable
          accessibilityLabel="Adicionar novo termo"
          accessibilityRole="button"
          onPress={onAddNewTerm}
          testID="onboarding-allergy-add-new-term">
          <Pill tone="clay" size="md">
            + Adicionar
          </Pill>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
