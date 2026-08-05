'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveAllergen, fetchAllergens, rejectAllergen } from '@/lib/api-client';

export function AllergensQueue() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-allergens'],
    queryFn: fetchAllergens,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-allergens'] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAllergen(id),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectAllergen(id),
    onSuccess: invalidate,
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p role="alert">Failed to load allergens.</p>;

  return (
    <ul>
      {data?.map((allergen) => (
        <li key={allergen.id}>
          {allergen.name}
          <button
            type="button"
            onClick={() => approveMutation.mutate(allergen.id)}
            disabled={approveMutation.isPending}
          >
            Aprovar
          </button>
          <button
            type="button"
            onClick={() => rejectMutation.mutate(allergen.id)}
            disabled={rejectMutation.isPending}
          >
            Rejeitar
          </button>
        </li>
      ))}
      {data && data.length === 0 && <p>No pending allergen terms.</p>}
    </ul>
  );
}
