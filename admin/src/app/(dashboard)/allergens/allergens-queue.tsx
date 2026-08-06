'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ApiError,
  approveAllergen,
  createAllergenTerm,
  deleteAllergenTerm,
  fetchAllergens,
  fetchApprovedAllergens,
  rejectAllergen,
  updateAllergenTerm,
} from '@/lib/api-client';
import type { Allergen, AllergenIngredientTerm } from '@/lib/types';

function PendingAllergensQueue() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-allergens', 'pending'],
    queryFn: fetchAllergens,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-allergens', 'pending'] });

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

function TermEditor({ allergen }: { allergen: Allergen }) {
  const queryClient = useQueryClient();
  const [newTerm, setNewTerm] = useState('');
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-allergens', 'approved'] });

  const handleError = (error: unknown) => {
    setFormError(error instanceof ApiError ? error.message : 'Request failed.');
  };

  const createMutation = useMutation({
    mutationFn: (term: string) => createAllergenTerm(allergen.id, term),
    onSuccess: () => {
      setFormError(null);
      setNewTerm('');
      invalidate();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ termId, term }: { termId: string; term: string }) =>
      updateAllergenTerm(allergen.id, termId, term),
    onSuccess: () => {
      setFormError(null);
      setEditingTermId(null);
      invalidate();
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (termId: string) => deleteAllergenTerm(allergen.id, termId),
    onSuccess: () => {
      setFormError(null);
      invalidate();
    },
    onError: handleError,
  });

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    createMutation.mutate(newTerm);
  }

  function startEditing(term: AllergenIngredientTerm) {
    setEditingTermId(term.id);
    setEditingValue(term.term);
  }

  function handleUpdate(event: React.FormEvent, termId: string) {
    event.preventDefault();
    updateMutation.mutate({ termId, term: editingValue });
  }

  return (
    <li>
      <h3>{allergen.name}</h3>
      <ul>
        {allergen.ingredientTerms?.map((term) =>
          editingTermId === term.id ? (
            <li key={term.id}>
              <form onSubmit={(event) => handleUpdate(event, term.id)}>
                <label htmlFor={`edit-term-${term.id}`}>Edit term</label>
                <input
                  id={`edit-term-${term.id}`}
                  value={editingValue}
                  onChange={(event) => setEditingValue(event.target.value)}
                  required
                />
                <button type="submit" disabled={updateMutation.isPending}>
                  Salvar
                </button>
                <button type="button" onClick={() => setEditingTermId(null)}>
                  Cancelar
                </button>
              </form>
            </li>
          ) : (
            <li key={term.id}>
              {term.term}
              <button type="button" onClick={() => startEditing(term)}>
                Editar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(term.id)}
                disabled={deleteMutation.isPending}
              >
                Remover
              </button>
            </li>
          ),
        )}
        {allergen.ingredientTerms && allergen.ingredientTerms.length === 0 && <p>No ingredient terms yet.</p>}
      </ul>

      <form onSubmit={handleCreate}>
        <label htmlFor={`new-term-${allergen.id}`}>New ingredient term</label>
        <input
          id={`new-term-${allergen.id}`}
          value={newTerm}
          onChange={(event) => setNewTerm(event.target.value)}
          required
        />
        <button type="submit" disabled={createMutation.isPending}>
          Adicionar termo
        </button>
      </form>

      {formError && <p role="alert">{formError}</p>}
    </li>
  );
}

function ApprovedAllergensEditor() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-allergens', 'approved'],
    queryFn: fetchApprovedAllergens,
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p role="alert">Failed to load approved allergens.</p>;

  return (
    <section>
      <h2>Catálogo de alérgenos aprovados</h2>
      <p>
        Alterar ou remover um termo não reclassifica receitas históricas automaticamente. Depois de
        editar o catálogo, rode <code>npm run allergens:backfill</code> para recalcular as receitas
        existentes.
      </p>
      <ul>
        {data?.map((allergen) => (
          <TermEditor key={allergen.id} allergen={allergen} />
        ))}
        {data && data.length === 0 && <p>No approved allergens yet.</p>}
      </ul>
    </section>
  );
}

export function AllergensQueue() {
  return (
    <div>
      <section>
        <h2>Fila de normalização pendente</h2>
        <PendingAllergensQueue />
      </section>
      <ApprovedAllergensEditor />
    </div>
  );
}
