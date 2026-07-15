import { useQuery } from '@tanstack/react-query';

import { onboardingService } from '@/module/onboarding/services/onboarding-service';

export const APPROVED_ALLERGENS_QUERY_KEY = ['onboarding', 'approved-allergens'];

export function useApprovedAllergensQuery() {
  return useQuery({
    queryKey: APPROVED_ALLERGENS_QUERY_KEY,
    queryFn: () => onboardingService.fetchApprovedAllergens(),
    staleTime: Infinity,
  });
}
