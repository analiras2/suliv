import { useLocalSearchParams } from 'expo-router';

import { RecipeDetailScreen } from '@/screens/recipe-detail-screen';

export default function RecipeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecipeDetailScreen recipeId={id} />;
}
