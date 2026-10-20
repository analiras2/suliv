'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBoosts, fetchRecipes } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format-date';
import { BOOST_STATUS_LABELS, type BoostStatus } from '@/lib/types';
import { BoostCreateForm } from './boost-create-form';

const STATUS_BADGE_CLASS: Record<BoostStatus, string> = {
  active: 'badge',
  upcoming: 'badge badge-warning',
  expired: 'badge badge-neutral',
};

export function BoostsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-boosts'],
    queryFn: fetchBoosts,
  });

  const { data: recipes } = useQuery({
    queryKey: ['admin-recipes', 'aprovada'],
    queryFn: () => fetchRecipes('aprovada'),
  });

  const recipeTitles = new Map(recipes?.items.map((recipe) => [recipe.id, recipe.title]));

  return (
    <div>
      {isLoading && <p>Carregando…</p>}
      {isError && <p role="alert">Não foi possível carregar os destaques.</p>}

      {data && data.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Receita</th>
              <th>Peso</th>
              <th>Início</th>
              <th>Término</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((boost) => (
              <tr key={boost.id}>
                <td>
                  <strong>{recipeTitles.get(boost.recipeId) ?? 'Receita'}</strong>
                  <div className="muted">ID: {boost.recipeId}</div>
                </td>
                <td>{boost.weight}</td>
                <td className="nowrap">{formatDateTime(boost.startsAt)}</td>
                <td className="nowrap">{formatDateTime(boost.endsAt)}</td>
                <td>
                  <span className={STATUS_BADGE_CLASS[boost.status]}>{BOOST_STATUS_LABELS[boost.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && data.length === 0 && <p className="empty-state">Nenhum destaque cadastrado.</p>}

      <h2>Novo destaque</h2>
      <BoostCreateForm />
    </div>
  );
}
