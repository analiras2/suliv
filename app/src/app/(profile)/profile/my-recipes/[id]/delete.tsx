import { useLocalSearchParams } from 'expo-router';

import { DeleteRecipeScreen } from '@/screens/delete-recipe-screen';

export default function DeleteRecipeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DeleteRecipeScreen recipeId={id} />;
}
