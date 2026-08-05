import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './auth';
import {
  createAuthor,
  createDbClient,
  createReport,
  createRecipe,
  ensureCategoryId,
  fetchRecipeStatus,
} from './fixtures';

// E2E-004: log in, open a pending report targeting a currently-approved
// recipe, resolve it with 'reopen_recipe' — the recipe reappears in the
// pending-recipes queue (status flips back to 'em_analise').
test('resolves a report by reopening its target recipe', async ({ page }) => {
  const client = createDbClient();
  await client.connect();

  try {
    const categoryId = await ensureCategoryId(client);
    const authorId = await createAuthor(client);
    const reporter = await createAuthor(client);
    const recipe = await createRecipe(client, { authorId, categoryId, status: 'aprovada' });
    await createReport(client, { targetId: recipe.id, targetType: 'recipe', reporterUserId: reporter });

    await loginAsAdmin(page);
    await page.goto('/reports');

    await expect(page.getByText(`Target recipe: ${recipe.title}`)).toBeVisible();
    await page.getByRole('button', { name: 'Reabrir receita' }).click();
    await expect(page.getByText(`Target recipe: ${recipe.title}`)).not.toBeVisible();

    const status = await fetchRecipeStatus(client, recipe.id);
    expect(status).toBe('em_analise');

    await page.goto('/recipes');
    await expect(page.getByRole('link', { name: recipe.title })).toBeVisible();
  } finally {
    await client.end();
  }
});
