import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { ListingScreen } from '@/screens/listing-screen';
import type { RecipeCategoryKey } from '@/module/recipes/types';
import type { ListingOrigin } from '@/module/search/types';

export default function VerTudoScreen() {
  const { origin, categoryKey } = useLocalSearchParams<{ origin: ListingOrigin; categoryKey?: RecipeCategoryKey }>();
  const router = useRouter();

  // A deep link (suliv://ver-tudo?...) opens this route with nothing behind it, where
  // back() is a silent no-op. Fall back to the feed so the control is never dead.
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [router]);

  return <ListingScreen origin={origin} categoryKey={categoryKey} onBack={goBack} />;
}
