import { useLocalSearchParams } from 'expo-router';

import { CookingScreen } from '@/screens/cooking-screen';

export default function CookRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <CookingScreen slug={slug} />;
}
