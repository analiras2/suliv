'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, createBoost, fetchRecipes } from '@/lib/api-client';

const DEFAULT_WEIGHT = 1;

export function BoostCreateForm() {
  const queryClient = useQueryClient();
  const [recipeId, setRecipeId] = useState('');
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: recipes } = useQuery({
    queryKey: ['admin-recipes', 'aprovada'],
    queryFn: () => fetchRecipes('aprovada'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createBoost({
        recipe_id: recipeId,
        weight,
        starts_at: startsAt,
        ends_at: endsAt,
      }),
    onSuccess: () => {
      setValidationError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-boosts'] });
    },
    onError: (error: unknown) => {
      setValidationError(error instanceof ApiError ? error.message : 'Failed to create boost.');
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (new Date(endsAt) <= new Date(startsAt)) {
      setValidationError('End date must be after the start date.');
      return;
    }
    setValidationError(null);
    createMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="boost-recipe">Recipe</label>
      <select id="boost-recipe" value={recipeId} onChange={(event) => setRecipeId(event.target.value)} required>
        <option value="">Select a recipe</option>
        {recipes?.items.map((recipe) => (
          <option key={recipe.id} value={recipe.id}>
            {recipe.title}
          </option>
        ))}
      </select>

      <label htmlFor="boost-weight">Weight</label>
      <input
        id="boost-weight"
        type="number"
        min={1}
        value={weight}
        onChange={(event) => setWeight(Number(event.target.value))}
        required
      />

      <label htmlFor="boost-starts-at">Starts at</label>
      <input
        id="boost-starts-at"
        type="datetime-local"
        value={startsAt}
        onChange={(event) => setStartsAt(event.target.value)}
        required
      />

      <label htmlFor="boost-ends-at">Ends at</label>
      <input
        id="boost-ends-at"
        type="datetime-local"
        value={endsAt}
        onChange={(event) => setEndsAt(event.target.value)}
        required
      />

      {validationError && <p role="alert">{validationError}</p>}

      <button type="submit" disabled={createMutation.isPending}>
        Create boost
      </button>
    </form>
  );
}
