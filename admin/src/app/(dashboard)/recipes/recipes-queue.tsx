'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { fetchRecipes } from '@/lib/api-client';
import { RECIPE_STATUS_LABELS, type RecipeStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: RecipeStatus | ''; label: string }[] = [
  { value: 'em_analise', label: RECIPE_STATUS_LABELS.em_analise },
  { value: 'aprovada', label: RECIPE_STATUS_LABELS.aprovada },
  { value: 'precisa_de_ajustes', label: RECIPE_STATUS_LABELS.precisa_de_ajustes },
  { value: 'removida', label: RECIPE_STATUS_LABELS.removida },
  { value: '', label: 'Todos' },
];

const DEFAULT_STATUS: RecipeStatus = 'em_analise';

export function RecipesQueue() {
  const [status, setStatus] = useState<RecipeStatus | ''>(DEFAULT_STATUS);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-recipes', status],
    queryFn: () => fetchRecipes(status || undefined),
  });

  return (
    <div>
      <div className="page-header">
        <h1>Fila de revisão de receitas</h1>
        <div className="inline-field">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value as RecipeStatus | '')}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p>Carregando…</p>}
      {isError && <p role="alert">Não foi possível carregar as receitas.</p>}

      {data && data.items.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Receita</th>
              <th className="align-end">Ação</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((recipe) => (
              <tr key={recipe.id}>
                <td>
                  <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                </td>
                <td className="align-end muted">Revisar</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && data.items.length === 0 && <p className="empty-state">Nenhuma receita neste status.</p>}
    </div>
  );
}
