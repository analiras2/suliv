import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { ListingScreen } from '@/screens/listing-screen';
import type { RecipeCategoryKey } from '@/module/recipes/types';
import type { ListingOrigin } from '@/module/search/types';

export default function VerTudoScreen() {
  const { origin, categoryKey } = useLocalSearchParams<{ origin: ListingOrigin; categoryKey?: RecipeCategoryKey }>();
  const router = useRouter();

  // A deep link (suliv://ver-tudo?...) opens this route with nothing behind it, where
  // back() is a silent no-op. Fall back to the feed so the control is never dead. The
  // group is named because '/' also matches (onboarding)/index, which the root guard
  // hides once onboarding is done, and a replace to a protected route does nothing.
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);

  return <ListingScreen origin={origin} categoryKey={categoryKey} onBack={goBack} />;
}
