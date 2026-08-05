'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBoosts } from '@/lib/api-client';
import { BoostCreateForm } from './boost-create-form';

export function BoostsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-boosts'],
    queryFn: fetchBoosts,
  });

  return (
    <div>
      {isLoading && <p>Loading…</p>}
      {isError && <p role="alert">Failed to load boosts.</p>}

      <ul>
        {data?.map((boost) => (
          <li key={boost.id}>
            Recipe {boost.recipeId} — weight {boost.weight} — {boost.startsAt} to {boost.endsAt} —
            status: {boost.status}
          </li>
        ))}
        {data && data.length === 0 && <p>No boosts yet.</p>}
      </ul>

      <BoostCreateForm />
    </div>
  );
}
