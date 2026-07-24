import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { RecipeCard } from '@/components/molecules/recipe-card';
import type { Recipe } from '@/module/recipes/types';

function buildRecipe(): Recipe {
  return {
    id: 'r1',
    slug: 'r1',
    title: 'Omelete de espinafre',
    coverImageUrl: null,
    category: { id: 'cat-1', key: 'cafe_da_manha', label: 'Café da manhã' },
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'vegetariano',
  };
}

describe('RecipeCard', () => {
  it('does not render a conflict badge when conflictsWithUser is not set', async () => {
    const rendered = await render(
      <RecipeCard recipe={buildRecipe()} saved={false} onToggleSave={jest.fn()} onOpen={jest.fn()} />,
    );

    expect(rendered.queryByTestId('recipe-card-conflict-badge-r1')).toBeNull();
  });

  it('renders a discreet conflict badge without hiding the recipe when conflictsWithUser is true', async () => {
    const rendered = await render(
      <RecipeCard
        recipe={buildRecipe()}
        saved={false}
        onToggleSave={jest.fn()}
        onOpen={jest.fn()}
        conflictsWithUser
      />,
    );

    expect(rendered.getByTestId('recipe-card-conflict-badge-r1')).toBeTruthy();
    expect(rendered.getByText('Omelete de espinafre')).toBeTruthy();
  });
});
