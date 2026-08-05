import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './auth';
import { createAuthor, createDbClient, createRecipe, ensureCategoryId, fetchRecipeStatus } from './fixtures';

// E2E-002: log in, open a pending recipe, review its full content, approve it —
// it disappears from the pending queue and its status flips to 'aprovada'
// (the status Recipe.searchVector-backed public search filters on).
test('reviews and approves a pending recipe', async ({ page }) => {
  const client = createDbClient();
  await client.connect();

  try {
    const categoryId = await ensureCategoryId(client);
    const authorId = await createAuthor(client);
    const recipe = await createRecipe(client, { authorId, categoryId, status: 'em_analise' });

    await loginAsAdmin(page);
    await page.goto('/recipes');
    await page.getByRole('link', { name: recipe.title }).click();

    await expect(page.getByRole('heading', { name: recipe.title })).toBeVisible();
    await expect(page.getByText('Descrição de teste gerada pelo E2E.')).toBeVisible();
    await expect(page.getByText('Misture os ingredientes.')).toBeVisible();

    await page.getByRole('button', { name: 'Aprovar' }).click();
    await page.waitForURL(/\/recipes$/);

    await expect(page.getByRole('link', { name: recipe.title })).not.toBeVisible();

    const status = await fetchRecipeStatus(client, recipe.id);
    expect(status).toBe('aprovada');
  } finally {
    await client.end();
  }
});
