'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateFeatureFlag, type UpdateFeatureFlagInput } from '@/lib/api-client';
import type { FeatureFlag } from '@/lib/types';

interface FeatureFlagRowProps {
  flag: FeatureFlag;
}

export function FeatureFlagRow({ flag }: FeatureFlagRowProps) {
  const queryClient = useQueryClient();
  const [rolloutPercentage, setRolloutPercentage] = useState(flag.rolloutPercentage ?? 0);

  const updateMutation = useMutation({
    mutationFn: (changes: UpdateFeatureFlagInput) => updateFeatureFlag(flag.key, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] }),
  });

  function handleToggle() {
    updateMutation.mutate({ enabled: !flag.enabled });
  }

  function handleRolloutCommit() {
    if (rolloutPercentage === flag.rolloutPercentage) return;
    updateMutation.mutate({ rollout_percentage: rolloutPercentage });
  }

  return (
    <li>
      <span>{flag.key}</span>
      <label>
        <input type="checkbox" checked={flag.enabled} onChange={handleToggle} disabled={updateMutation.isPending} />
        Enabled
      </label>
      <label htmlFor={`rollout-${flag.key}`}>Rollout %</label>
      <input
        id={`rollout-${flag.key}`}
        type="number"
        min={0}
        max={100}
        value={rolloutPercentage}
        onChange={(event) => setRolloutPercentage(Number(event.target.value))}
        onBlur={handleRolloutCommit}
        disabled={updateMutation.isPending}
      />
    </li>
  );
}
