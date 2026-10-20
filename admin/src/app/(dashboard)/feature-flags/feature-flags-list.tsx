'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFeatureFlags } from '@/lib/api-client';
import { FeatureFlagRow } from './feature-flag-row';

export function FeatureFlagsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: fetchFeatureFlags,
  });

  if (isLoading) return <p>Carregando…</p>;
  if (isError) return <p role="alert">Não foi possível carregar as flags.</p>;
  if (data && data.length === 0) return <p className="empty-state">Nenhuma flag configurada.</p>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Flag</th>
          <th>Ativa</th>
          <th>Rollout (%)</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((flag) => (
          <FeatureFlagRow key={flag.key} flag={flag} />
        ))}
      </tbody>
    </table>
  );
}
