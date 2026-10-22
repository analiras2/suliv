import { useLocalSearchParams } from 'expo-router';

import { RecipeFormScreen } from '@/screens/recipe-form-screen';

export default function EditRecipeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecipeFormScreen recipeId={id} />;
}
