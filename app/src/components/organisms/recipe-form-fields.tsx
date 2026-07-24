import { StyleSheet, View } from 'react-native';

import { Overline } from '@/components/atoms/overline';
import { FormField } from '@/components/molecules/form-field';
import { RecipeIngredientFormList } from '@/components/organisms/recipe-ingredient-form-list';
import { RecipeOptionPicker } from '@/components/organisms/recipe-option-picker';
import { RecipeStepFormList } from '@/components/organisms/recipe-step-form-list';
import { spacing } from '@/design-system/tokens';
import type { Category } from '@/module/recipes/types';
import type { RecipeFormViewModel } from '@/module/recipe-authoring/viewModels/use-recipe-form-view-model';

const DIFFICULTY_OPTIONS = [
  { value: 'iniciante' as const, label: 'Iniciante', icon: 'star' as const },
  { value: 'intermediario' as const, label: 'Intermediário', icon: 'star' as const },
  { value: 'avancado' as const, label: 'Avançado', icon: 'star' as const },
];

const DIET_OPTIONS = [
  { value: 'vegano' as const, label: 'Vegano', icon: 'vegan' as const },
  { value: 'vegetariano' as const, label: 'Vegetariano', icon: 'vegetarian' as const },
  { value: 'flexitariano' as const, label: 'Flexitariano', icon: 'flexitarian' as const },
];

export type RecipeFormFieldsProps = {
  form: RecipeFormViewModel;
  categories: Category[];
};

export function RecipeFormFields({ form, categories }: RecipeFormFieldsProps) {
  return (
    <View style={styles.container}>
      <FormField label="Título" value={form.fields.title} onChangeText={(title) => form.updateField({ title })} testID="recipe-form-title" />
      <FormField
        label="Descrição"
        value={form.fields.description}
        onChangeText={(description) => form.updateField({ description })}
        multiline
        testID="recipe-form-description"
      />
      <FormField
        label="Tempo de preparo (minutos)"
        value={form.fields.prepTimeMinutes === null ? '' : String(form.fields.prepTimeMinutes)}
        onChangeText={(value) => form.updateField({ prepTimeMinutes: value === '' ? null : Number(value) })}
        keyboardType="number-pad"
        testID="recipe-form-prep-time"
      />
      <FormField
        label="Porções"
        value={form.fields.servings === null ? '' : String(form.fields.servings)}
        onChangeText={(value) => form.updateField({ servings: value === '' ? null : Number(value) })}
        keyboardType="number-pad"
        testID="recipe-form-servings"
      />

      <RecipeOptionPicker
        label="Categoria"
        options={categories.map((category) => ({ value: category.id, label: category.label, icon: 'leaf' as const }))}
        selected={form.fields.categoryId}
        onSelect={(categoryId) => form.updateField({ categoryId })}
        testID="recipe-form-category"
      />
      <RecipeOptionPicker
        label="Dificuldade"
        options={DIFFICULTY_OPTIONS}
        selected={form.fields.difficulty}
        onSelect={(difficulty) => form.updateField({ difficulty })}
        testID="recipe-form-difficulty"
      />
      <RecipeOptionPicker
        label="Restrição alimentar"
        options={DIET_OPTIONS}
        selected={form.fields.dietPreference}
        onSelect={(dietPreference) => form.updateField({ dietPreference })}
        testID="recipe-form-diet"
      />

      <View style={styles.section}>
        <Overline>ingredientes</Overline>
        <RecipeIngredientFormList
          ingredients={form.fields.ingredients}
          onAdd={form.addIngredient}
          onUpdate={form.updateIngredient}
          onRemove={form.removeIngredient}
        />
      </View>

      <View style={styles.section}>
        <Overline>modo de preparo</Overline>
        <RecipeStepFormList
          steps={form.fields.steps}
          onAdd={form.addStep}
          onUpdate={form.updateStep}
          onRemove={form.removeStep}
        />
      </View>

      <FormField
        label="Mensagem para o moderador (opcional)"
        value={form.fields.authorMessageToModerator ?? ''}
        onChangeText={(authorMessageToModerator) => form.updateField({ authorMessageToModerator })}
        multiline
        testID="recipe-form-moderator-message"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs + 2,
  },
});
