'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFeatureFlags } from '@/lib/api-client';
import { FeatureFlagRow } from './feature-flag-row';

export function FeatureFlagsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: fetchFeatureFlags,
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p role="alert">Failed to load feature flags.</p>;

  return (
    <ul>
      {data?.map((flag) => (
        <FeatureFlagRow key={flag.key} flag={flag} />
      ))}
      {data && data.length === 0 && <p>No feature flags configured.</p>}
    </ul>
  );
}
