import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SearchField } from '@/components/molecules/search-field';
import { OnboardingAddedTerms } from '@/components/organisms/onboarding-added-terms';
import { OnboardingAllergenOptions } from '@/components/organisms/onboarding-allergen-options';
import { semanticColors, spacing, typography } from '@/design-system/tokens';
import { useApprovedAllergensQuery } from '@/module/onboarding/queries/use-approved-allergens-query';

export type OnboardingAllergiesStepProps = {
  allergenIds: string[];
  newTerms: string[];
  onToggleAllergen: (id: string) => void;
  onAddNewTerm: (term: string) => void;
};

export function OnboardingAllergiesStep({
  allergenIds,
  newTerms,
  onToggleAllergen,
  onAddNewTerm,
}: OnboardingAllergiesStepProps) {
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
});
