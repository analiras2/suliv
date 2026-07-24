import { useLocalSearchParams } from 'expo-router';

import { ListingScreen } from '@/screens/listing-screen';
import type { RecipeCategoryKey } from '@/module/recipes/types';
import type { ListingOrigin } from '@/module/search/types';

export default function VerTudoScreen() {
  const { origin, categoryKey } = useLocalSearchParams<{ origin: ListingOrigin; categoryKey?: RecipeCategoryKey }>();

  return <ListingScreen origin={origin} categoryKey={categoryKey} />;
}
