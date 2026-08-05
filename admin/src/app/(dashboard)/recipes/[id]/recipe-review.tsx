'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { approveRecipe, fetchRecipeDetail, requestRecipeAdjustment } from '@/lib/api-client';
import type { AdjustmentReason } from '@/lib/types';
import { AdjustmentReasonPicker } from './adjustment-reason-picker';

interface RecipeReviewProps {
  recipeId: string;
}

export function RecipeReview({ recipeId }: RecipeReviewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<AdjustmentReason | ''>('');
  const [note, setNote] = useState('');
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: ['admin-recipe', recipeId],
    queryFn: () => fetchRecipeDetail(recipeId),
  });

  function goBackToQueue() {
    queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
    router.push('/recipes');
  }

  const approveMutation = useMutation({
    mutationFn: () => approveRecipe(recipeId),
    onSuccess: goBackToQueue,
  });

  const adjustmentMutation = useMutation({
    mutationFn: () => requestRecipeAdjustment(recipeId, reason, note),
    onSuccess: goBackToQueue,
  });

  function handleRequestAdjustment() {
    if (!reason) {
      setAdjustmentError('Select an adjustment reason.');
      return;
    }
    setAdjustmentError(null);
    adjustmentMutation.mutate();
  }

  if (isLoading) return <p>Loading…</p>;
  if (isError || !recipe) return <p role="alert">Failed to load recipe.</p>;

  return (
    <div>
      <h1>{recipe.title}</h1>
      {recipe.coverImageUrl && <img src={recipe.coverImageUrl} alt={recipe.title} width={320} />}
      <p>Status: {recipe.status}</p>
      {recipe.authorMessageToModerator && <p>Author note: {recipe.authorMessageToModerator}</p>}

      <h2>Description</h2>
      <p>{recipe.description}</p>

      <h2>Ingredients</h2>
      <ul>
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.name}>
            {ingredient.name}
            {ingredient.quantity ? ` — ${ingredient.quantity} ${ingredient.unit}` : ''}
          </li>
        ))}
      </ul>

      <h2>Steps</h2>
      <ol>
        {recipe.steps.map((step) => (
          <li key={step.order}>{step.description}</li>
        ))}
      </ol>

      <button type="button" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
        Aprovar
      </button>

      <fieldset>
        <legend>Solicitar ajuste</legend>
        <AdjustmentReasonPicker value={reason} onChange={setReason} />
        <label htmlFor="adjustment-note">Note (optional)</label>
        <textarea
          id="adjustment-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {adjustmentError && <p role="alert">{adjustmentError}</p>}
        <button type="button" onClick={handleRequestAdjustment} disabled={adjustmentMutation.isPending}>
          Solicitar ajuste
        </button>
      </fieldset>
    </div>
  );
}
