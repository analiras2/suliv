import { useLocalSearchParams } from 'expo-router';

import { RecipeDetailScreen } from '@/screens/recipe-detail-screen';

export default function RecipeRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <RecipeDetailScreen recipeId={slug} />;
}
