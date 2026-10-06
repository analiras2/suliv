'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  approveAllergen,
  createAllergenTerm,
  deleteAllergenTerm,
  fetchAllergens,
  fetchApprovedAllergens,
  rejectAllergen,
  updateAllergenTerm,
} from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
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

  if (isLoading) return <p>Carregando…</p>;
  if (isError) return <p role="alert">Não foi possível carregar os alérgenos.</p>;

  return (
    <>
      <ul className="card-list">
        {data?.map((allergen) => (
          <li key={allergen.id} className="card card-header">
            <strong>{allergen.name}</strong>
            <div className="row-actions">
              <button
                type="button"
                className="btn-sm"
                onClick={() => approveMutation.mutate(allergen.id)}
                disabled={approveMutation.isPending}
              >
                Aprovar
              </button>
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => rejectMutation.mutate(allergen.id)}
                disabled={rejectMutation.isPending}
              >
                Rejeitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {data && data.length === 0 && <p className="empty-state">Nenhum termo pendente.</p>}
    </>
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
    setFormError(getErrorMessage(error));
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
    <li className="card">
      <h3>{allergen.name}</h3>
      <ul className="term-list">
        {allergen.ingredientTerms?.map((term) =>
          editingTermId === term.id ? (
            <li key={term.id}>
              <form className="inline-form" onSubmit={(event) => handleUpdate(event, term.id)}>
                <label htmlFor={`edit-term-${term.id}`}>Editar termo</label>
                <input
                  id={`edit-term-${term.id}`}
                  value={editingValue}
                  onChange={(event) => setEditingValue(event.target.value)}
                  required
                />
                <button type="submit" className="btn-sm" disabled={updateMutation.isPending}>
                  Salvar
                </button>
                <button type="button" className="btn-secondary btn-sm" onClick={() => setEditingTermId(null)}>
                  Cancelar
                </button>
              </form>
            </li>
          ) : (
            <li key={term.id}>
              <span>{term.term}</span>
              <div className="row-actions">
                <button type="button" className="btn-secondary btn-sm" onClick={() => startEditing(term)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => deleteMutation.mutate(term.id)}
                  disabled={deleteMutation.isPending}
                >
                  Remover
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {allergen.ingredientTerms && allergen.ingredientTerms.length === 0 && (
        <p className="empty-state">Nenhum termo de ingrediente ainda.</p>
      )}

      <form className="inline-form" onSubmit={handleCreate}>
        <label htmlFor={`new-term-${allergen.id}`}>Novo termo de ingrediente</label>
        <input
          id={`new-term-${allergen.id}`}
          value={newTerm}
          onChange={(event) => setNewTerm(event.target.value)}
          required
        />
        <button type="submit" className="btn-sm" disabled={createMutation.isPending}>
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

  if (isLoading) return <p>Carregando…</p>;
  if (isError) return <p role="alert">Não foi possível carregar os alérgenos aprovados.</p>;

  return (
    <section>
      <h2>Catálogo de alérgenos aprovados</h2>
      <p>
        Alterar ou remover um termo não reclassifica receitas históricas automaticamente. Depois de
        editar o catálogo, rode <code>npm run allergens:backfill</code> para recalcular as receitas
        existentes.
      </p>
      <ul className="card-list">
        {data?.map((allergen) => (
          <TermEditor key={allergen.id} allergen={allergen} />
        ))}
      </ul>
      {data && data.length === 0 && <p className="empty-state">Nenhum alérgeno aprovado ainda.</p>}
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
