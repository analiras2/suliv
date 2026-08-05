'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { fetchRecipes } from '@/lib/api-client';
import type { RecipeStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: RecipeStatus | ''; label: string }[] = [
  { value: 'em_analise', label: 'Em análise' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'precisa_de_ajustes', label: 'Precisa de ajustes' },
  { value: 'removida', label: 'Removida' },
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

      {isLoading && <p>Loading…</p>}
      {isError && <p role="alert">Failed to load recipes.</p>}

      <ul>
        {data?.items.map((recipe) => (
          <li key={recipe.id}>
            <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
          </li>
        ))}
      </ul>

      {data && data.items.length === 0 && <p>No recipes in this status.</p>}
    </div>
  );
}
