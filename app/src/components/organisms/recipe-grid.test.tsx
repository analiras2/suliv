import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Text } from 'react-native';

import { RecipeGrid, type GridRecipe } from '@/components/organisms/recipe-grid';

function buildRecipe(id: string, conflictsWithUser?: boolean): GridRecipe {
  return {
    id,
    slug: id,
    title: `Recipe ${id}`,
    coverImageUrl: null,
    category: { id: 'cat-1', key: 'lanche', label: 'Lanche' },
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    conflictsWithUser,
  };
}

describe('RecipeGrid', () => {
  it('calls onEndReached when the list is scrolled near the bottom', async () => {
    const onEndReached = jest.fn();
    const rendered = await render(
      <RecipeGrid
        recipes={[buildRecipe('r1')]}
        savedIds={new Set()}
        onToggleSave={jest.fn()}
        onOpen={jest.fn()}
        onEndReached={onEndReached}
        testIDPrefix="grid-card"
      />,
    );

    fireEvent(rendered.getByTestId('recipe-grid-list'), 'endReached');

    expect(onEndReached).toHaveBeenCalled();
  });

  it('forwards conflictsWithUser to the recipe card without hiding conflicting recipes', async () => {
    const rendered = await render(
      <RecipeGrid
        recipes={[buildRecipe('r1', false), buildRecipe('r2', true)]}
        savedIds={new Set()}
        onToggleSave={jest.fn()}
        onOpen={jest.fn()}
        testIDPrefix="grid-card"
      />,
    );

    expect(rendered.queryByTestId('recipe-card-conflict-badge-r1')).toBeNull();
    expect(rendered.getByTestId('recipe-card-conflict-badge-r2')).toBeTruthy();
    expect(rendered.getByTestId('grid-card-0')).toBeTruthy();
    expect(rendered.getByTestId('grid-card-1')).toBeTruthy();
  });

  it('renders the provided header and empty components', async () => {
    const rendered = await render(
      <RecipeGrid
        recipes={[]}
        savedIds={new Set()}
        onToggleSave={jest.fn()}
        onOpen={jest.fn()}
        ListHeaderComponent={<Text>header</Text>}
        ListEmptyComponent={<Text>empty</Text>}
      />,
    );

    expect(rendered.getByText('header')).toBeTruthy();
    expect(rendered.getByText('empty')).toBeTruthy();
  });
});
