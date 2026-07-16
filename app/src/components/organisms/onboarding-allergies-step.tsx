import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { SearchField } from '@/components/molecules/search-field';
import { OnboardingAddedTerms } from '@/components/organisms/onboarding-added-terms';
import { OnboardingAllergenOptions } from '@/components/organisms/onboarding-allergen-options';
import { radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useApprovedAllergensQuery } from '@/module/onboarding/queries/use-approved-allergens-query';

export type OnboardingAllergiesStepProps = {
  allergenIds: string[];
  newTerms: string[];
  onToggleAllergen: (id: string) => void;
  onAddNewTerm: (term: string) => void;
  onClearAllergies: () => void;
};

export function OnboardingAllergiesStep({
  allergenIds,
  newTerms,
  onToggleAllergen,
  onAddNewTerm,
  onClearAllergies,
}: OnboardingAllergiesStepProps) {
  const isNoneSelected = allergenIds.length === 0 && newTerms.length === 0;
  const [search, setSearch] = useState('');
  const { data: approvedAllergens = [] } = useApprovedAllergensQuery();

  const normalizedSearch = search.trim().toLowerCase();
  const filteredAllergens = useMemo(() => {
    if (!normalizedSearch) {
      return approvedAllergens;
    }
    return approvedAllergens.filter((allergen) => allergen.name.toLowerCase().includes(normalizedSearch));
  }, [approvedAllergens, normalizedSearch]);

  const hasExactMatch = filteredAllergens.some((allergen) => allergen.name.toLowerCase() === normalizedSearch);
  const canAddNewTerm = normalizedSearch.length > 0 && !hasExactMatch;

  function handleAddNewTerm() {
    onAddNewTerm(search.trim());
    setSearch('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Você tem alguma alergia alimentar?</Text>
      <SearchField
        placeholder="Buscar alergia…"
        testID="onboarding-allergy-search-input"
        value={search}
        onChangeText={setSearch}
      />
      <Pressable
        accessibilityLabel="Nenhuma alergia ou restrição"
        accessibilityRole="button"
        accessibilityState={{ selected: isNoneSelected }}
        onPress={onClearAllergies}
        style={[styles.noneButton, isNoneSelected && styles.noneButtonSelected]}
        testID="onboarding-allergy-none-button">
        <Text style={[styles.noneButtonText, isNoneSelected && styles.noneButtonTextSelected]}>
          Nenhuma alergia ou restrição
        </Text>
        {isNoneSelected ? <Icon color={semanticColors.fgInverse} name="check" size={16} /> : null}
      </Pressable>
      <OnboardingAllergenOptions
        allergens={filteredAllergens}
        canAddNewTerm={canAddNewTerm}
        onAddNewTerm={handleAddNewTerm}
        onToggle={onToggleAllergen}
        selectedIds={allergenIds}
      />
      <OnboardingAddedTerms terms={newTerms} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    ...typography.labelMd,
    color: semanticColors.fg,
  },
  noneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  noneButtonSelected: {
    backgroundColor: semanticColors.surfaceInverse,
    borderColor: semanticColors.surfaceInverse,
  },
  noneButtonText: {
    ...typography.bodyMd,
    color: semanticColors.fg,
  },
  noneButtonTextSelected: {
    color: semanticColors.fgInverse,
  },
});
