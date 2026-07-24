import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Pill, type PillTone } from '@/components/atoms/pill';
import { spacing } from '@/design-system/tokens';
import type { Difficulty, DietPreference, RecipeCategoryKey, TimeBucket } from '@/module/recipes/types';
import { CATEGORY_LABELS, type ListingFilters } from '@/module/search/types';

const TIME_LABELS: Record<TimeBucket, string> = {
  ate_15: 'Até 15 min',
  quinze_30: '15-30 min',
  trinta_60: '30-60 min',
  sessenta_mais: '60 min+',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

const DIET_LABELS: Record<DietPreference, string> = {
  vegano: 'Vegano',
  vegetariano: 'Vegetariano',
  flexitariano: 'Flexitariano',
};

export interface AllergenOption {
  id: string;
  name: string;
}

export type FilterBarProps = {
  filters: ListingFilters;
  onChangeFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K] | undefined) => void;
  allergenOptions?: AllergenOption[];
};

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: ChipProps) {
  const tone: PillTone = selected ? 'ink' : 'sand';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      <Pill tone={tone}>{label}</Pill>
    </Pressable>
  );
}

export function FilterBar({ filters, onChangeFilter, allergenOptions = [] }: FilterBarProps) {
  const toggleCategory = useCallback(
    (value: RecipeCategoryKey) => onChangeFilter('category', filters.category === value ? undefined : value),
    [filters.category, onChangeFilter],
  );
  const toggleTime = useCallback(
    (value: TimeBucket) => onChangeFilter('time', filters.time === value ? undefined : value),
    [filters.time, onChangeFilter],
  );
  const toggleDifficulty = useCallback(
    (value: Difficulty) => onChangeFilter('difficulty', filters.difficulty === value ? undefined : value),
    [filters.difficulty, onChangeFilter],
  );
  const toggleDiet = useCallback(
    (value: DietPreference) => onChangeFilter('diet', filters.diet === value ? undefined : value),
    [filters.diet, onChangeFilter],
  );
  const toggleAllergen = useCallback(
    (id: string) => {
      const current = filters.allergens ?? [];
      const next = current.includes(id) ? current.filter((allergenId) => allergenId !== id) : [...current, id];
      onChangeFilter('allergens', next.length > 0 ? next : undefined);
    },
    [filters.allergens, onChangeFilter],
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.group}>
        {(Object.keys(CATEGORY_LABELS) as RecipeCategoryKey[]).map((key) => (
          <FilterChip
            key={key}
            label={CATEGORY_LABELS[key]}
            selected={filters.category === key}
            onPress={() => toggleCategory(key)}
          />
        ))}
      </View>
      <View style={styles.group}>
        {(Object.keys(TIME_LABELS) as TimeBucket[]).map((key) => (
          <FilterChip key={key} label={TIME_LABELS[key]} selected={filters.time === key} onPress={() => toggleTime(key)} />
        ))}
      </View>
      <View style={styles.group}>
        {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((key) => (
          <FilterChip
            key={key}
            label={DIFFICULTY_LABELS[key]}
            selected={filters.difficulty === key}
            onPress={() => toggleDifficulty(key)}
          />
        ))}
      </View>
      <View style={styles.group}>
        {(Object.keys(DIET_LABELS) as DietPreference[]).map((key) => (
          <FilterChip key={key} label={DIET_LABELS[key]} selected={filters.diet === key} onPress={() => toggleDiet(key)} />
        ))}
      </View>
      {allergenOptions.length > 0 ? (
        <View style={styles.group}>
          {allergenOptions.map((allergen) => (
            <FilterChip
              key={allergen.id}
              label={allergen.name}
              selected={(filters.allergens ?? []).includes(allergen.id)}
              onPress={() => toggleAllergen(allergen.id)}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg - 4,
    gap: spacing.md,
  },
  group: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginRight: spacing.md,
  },
});
