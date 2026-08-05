import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './auth';
import { createAuthor, createDbClient, createRecipe, ensureCategoryId, fetchRecipeAdjustment } from './fixtures';

// E2E-003: log in, open a different pending recipe, request adjustment with a
// reason and note — it disappears from the pending queue and the recipe row
// reflects 'precisa_de_ajustes' with the given reason (the status the
// author-facing "Minhas Receitas" screen reads).
test('requests adjustment on a pending recipe with a reason and note', async ({ page }) => {
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

    await page.getByLabel('Adjustment reason').selectOption('falta_foto');
    await page.getByLabel('Note (optional)').fill('Adicione uma foto do prato finalizado.');
    await page.getByRole('button', { name: 'Solicitar ajuste' }).click();
    await page.waitForURL(/\/recipes$/);

    await expect(page.getByRole('link', { name: recipe.title })).not.toBeVisible();

    const result = await fetchRecipeAdjustment(client, recipe.id);
    expect(result.status).toBe('precisa_de_ajustes');
    expect(result.adjustmentReason).toBe('falta_foto');
    expect(result.adjustmentNote).toBe('Adicione uma foto do prato finalizado.');
  } finally {
    await client.end();
  }
});
