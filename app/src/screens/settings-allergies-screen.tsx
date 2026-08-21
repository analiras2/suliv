import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/icon';
import { SearchField } from '@/components/molecules/search-field';
import { SettingsHeader } from '@/components/molecules/settings-header';
import { OnboardingAddedTerms } from '@/components/organisms/onboarding-added-terms';
import { ProfileAllergenOptions } from '@/components/organisms/profile-allergen-options';
import { layout, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useApprovedAllergensQuery } from '@/module/onboarding/queries/use-approved-allergens-query';
import { useSettingsViewModel } from '@/module/profile/viewModels/use-settings-view-model';

// NOTE: the backend contract (task 1) does not return the user's current allergen ids on
// GET/PATCH /me, so this screen cannot pre-populate the selection from useSessionStore as the
// TechSpec describes — it starts from an empty selection until that gap is closed upstream.
export function SettingsAllergiesScreen() {
  const router = useRouter();
  const { error, updateAllergies } = useSettingsViewModel();
  const [allergenIds, setAllergenIds] = useState<string[]>([]);
  const [newTerms, setNewTerms] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { data: approvedAllergens = [] } = useApprovedAllergensQuery();

  const normalizedSearch = search.trim().toLowerCase();
  const filteredAllergens = useMemo(() => {
    if (!normalizedSearch) return approvedAllergens;
    return approvedAllergens.filter((allergen) => allergen.name.toLowerCase().includes(normalizedSearch));
  }, [approvedAllergens, normalizedSearch]);

  const hasExactMatch = filteredAllergens.some((allergen) => allergen.name.toLowerCase() === normalizedSearch);
  const canAddNewTerm = normalizedSearch.length > 0 && !hasExactMatch;
  const isNoneSelected = allergenIds.length === 0 && newTerms.length === 0;

  function toggleAllergen(id: string) {
    const next = allergenIds.includes(id) ? allergenIds.filter((current) => current !== id) : [...allergenIds, id];
    setAllergenIds(next);
    void updateAllergies(next);
  }

  function handleAddNewTerm() {
    const term = search.trim();
    const next = [...newTerms, term];
    setNewTerms(next);
    setSearch('');
    void updateAllergies(allergenIds, term);
  }

  function handleClearAllergies() {
    setAllergenIds([]);
    setNewTerms([]);
    void updateAllergies([]);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SettingsHeader onBack={router.back} title="Alergias e restrições" />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <SearchField
          onChangeText={setSearch}
          placeholder="Buscar alergia…"
          testID="settings-allergy-search-input"
          value={search}
        />
        <Pressable
          accessibilityLabel="Nenhuma alergia ou restrição"
          accessibilityRole="button"
          accessibilityState={{ selected: isNoneSelected }}
          onPress={handleClearAllergies}
          style={[styles.noneButton, isNoneSelected && styles.noneButtonSelected]}
          testID="settings-allergy-none-button">
          <Text style={[styles.noneButtonText, isNoneSelected && styles.noneButtonTextSelected]}>
            Nenhuma alergia ou restrição
          </Text>
          {isNoneSelected ? <Icon color={semanticColors.fgInverse} name="check" size={16} /> : null}
        </Pressable>
        <ProfileAllergenOptions
          allergens={filteredAllergens}
          canAddNewTerm={canAddNewTerm}
          onAddNewTerm={handleAddNewTerm}
          onToggle={toggleAllergen}
          selectedIds={allergenIds}
        />
        <OnboardingAddedTerms terms={newTerms} />
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
    gap: spacing.md,
    paddingHorizontal: layout.screenGutter,
    paddingBottom: layout.tabBarClearance,
  },
  error: {
    ...typography.bodyMd,
    color: semanticColors.danger,
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
