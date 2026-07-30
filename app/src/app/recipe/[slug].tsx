import { useLocalSearchParams } from 'expo-router';

import { RecipeDetailScreen } from '@/screens/recipe-detail-screen';

export default function RecipeRoute() {
  const { slug, origin } = useLocalSearchParams<{ slug: string; origin?: string }>();
  return <RecipeDetailScreen recipeId={slug} origin={origin} />;
}
