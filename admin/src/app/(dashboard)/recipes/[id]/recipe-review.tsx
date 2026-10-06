'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { approveRecipe, fetchRecipeDetail, requestRecipeAdjustment } from '@/lib/api-client';
import { RECIPE_STATUS_LABELS, type AdjustmentReason } from '@/lib/types';
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
      setAdjustmentError('Selecione um motivo de ajuste.');
      return;
    }
    setAdjustmentError(null);
    adjustmentMutation.mutate();
  }

  if (isLoading) return <p>Carregando…</p>;
  if (isError || !recipe) return <p role="alert">Não foi possível carregar a receita.</p>;

  return (
    <div>
      <h1>{recipe.title}</h1>
      {recipe.coverImageUrl && <img src={recipe.coverImageUrl} alt={recipe.title} width={320} />}
      <p>
        Status: <span className="badge">{RECIPE_STATUS_LABELS[recipe.status]}</span>
      </p>
      {recipe.authorMessageToModerator && <p>Mensagem da autora: {recipe.authorMessageToModerator}</p>}

      <h2>Descrição</h2>
      <p>{recipe.description}</p>

      <h2>Ingredientes</h2>
      <ul>
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.name}>
            {ingredient.name}
            {ingredient.quantity ? ` — ${ingredient.quantity} ${ingredient.unit}` : ''}
          </li>
        ))}
      </ul>

      <h2>Modo de preparo</h2>
      <ol>
        {recipe.steps.map((step) => (
          <li key={step.order}>{step.description}</li>
        ))}
      </ol>

      <div className="row-actions section-gap">
        <button
          type="button"
          className="btn-sm"
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending}
        >
          Aprovar
        </button>
      </div>

      <fieldset>
        <legend>Solicitar ajuste</legend>
        <AdjustmentReasonPicker value={reason} onChange={setReason} />
        <label htmlFor="adjustment-note">Observação (opcional)</label>
        <textarea
          id="adjustment-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {adjustmentError && <p role="alert">{adjustmentError}</p>}
        <button type="button" className="btn-secondary btn-sm" onClick={handleRequestAdjustment} disabled={adjustmentMutation.isPending}>
          Solicitar ajuste
        </button>
      </fieldset>
    </div>
  );
}
