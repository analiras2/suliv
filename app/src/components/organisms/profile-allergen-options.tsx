import { Pressable, StyleSheet, View } from 'react-native';

import { type IconName } from '@/components/atoms/icon';
import { Pill } from '@/components/atoms/pill';
import { OptionCard } from '@/components/molecules/option-card';
import { spacing } from '@/design-system/tokens';
import type { ApprovedAllergen } from '@/module/onboarding/services/onboarding-service';

export type ProfileAllergenOptionsProps = {
  allergens: ApprovedAllergen[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  canAddNewTerm: boolean;
  onAddNewTerm: () => void;
};

const ALLERGEN_ICON_KEYWORDS: { keyword: string; icon: IconName }[] = [
  { keyword: 'leite', icon: 'milk' },
  { keyword: 'ovo', icon: 'eggs' },
  { keyword: 'amendoim', icon: 'peanut' },
  { keyword: 'soja', icon: 'soy' },
  { keyword: 'glúten', icon: 'wheat' },
  { keyword: 'gluten', icon: 'wheat' },
  { keyword: 'trigo', icon: 'wheat' },
  { keyword: 'castanha', icon: 'nuts' },
  { keyword: 'noz', icon: 'nuts' },
  { keyword: 'gergelim', icon: 'sesame' },
];

function iconForAllergen(name: string): IconName {
  const normalized = name.toLowerCase();
  const match = ALLERGEN_ICON_KEYWORDS.find(({ keyword }) => normalized.includes(keyword));
  return match ? match.icon : 'leaf';
}

export function ProfileAllergenOptions({
  allergens,
  selectedIds,
  onToggle,
  canAddNewTerm,
  onAddNewTerm,
}: ProfileAllergenOptionsProps) {
  return (
    <View style={styles.options}>
      {allergens.map((allergen) => {
        const isSelected = selectedIds.includes(allergen.id);
        return (
          <OptionCard
            accessibilityLabel={allergen.name}
            icon={iconForAllergen(allergen.name)}
            key={allergen.id}
            onPress={() => onToggle(allergen.id)}
            selected={isSelected}
            selectionMode="multiple"
            testID={`settings-allergy-option-${allergen.id}`}
            title={allergen.name}
          />
        );
      })}
      {canAddNewTerm && (
        <Pressable
          accessibilityLabel="Adicionar novo termo"
          accessibilityRole="button"
          onPress={onAddNewTerm}
          testID="settings-allergy-add-new-term">
          <Pill size="md" tone="clay">
            + Adicionar
          </Pill>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.sm,
  },
});
