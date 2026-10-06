'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createBoost, fetchRecipes } from '@/lib/api-client';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/error-messages';

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
      setValidationError(getErrorMessage(error));
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (new Date(endsAt) <= new Date(startsAt)) {
      setValidationError(ERROR_MESSAGES.BOOST_INVALID_PERIOD);
      return;
    }
    setValidationError(null);
    createMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="form-stack">
      <label htmlFor="boost-recipe">Receita</label>
      <select id="boost-recipe" value={recipeId} onChange={(event) => setRecipeId(event.target.value)} required>
        <option value="">Selecione uma receita</option>
        {recipes?.items.map((recipe) => (
          <option key={recipe.id} value={recipe.id}>
            {recipe.title}
          </option>
        ))}
      </select>

      <label htmlFor="boost-weight">Peso</label>
      <input
        id="boost-weight"
        type="number"
        min={1}
        value={weight}
        onChange={(event) => setWeight(Number(event.target.value))}
        required
      />

      <label htmlFor="boost-starts-at">Início</label>
      <input
        id="boost-starts-at"
        type="datetime-local"
        value={startsAt}
        onChange={(event) => setStartsAt(event.target.value)}
        required
      />

      <label htmlFor="boost-ends-at">Término</label>
      <input
        id="boost-ends-at"
        type="datetime-local"
        value={endsAt}
        onChange={(event) => setEndsAt(event.target.value)}
        required
      />

      {validationError && <p role="alert">{validationError}</p>}

      <button type="submit" disabled={createMutation.isPending}>
        Criar destaque
      </button>
    </form>
  );
}
