import { Redirect, useLocalSearchParams } from 'expo-router';

export default function RecipeDeepLinkRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <Redirect href={`/recipe/${slug}`} />;
}
