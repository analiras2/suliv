import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './auth';
import { createApprovedAllergen, createDbClient } from './fixtures';

// E2E-004: sign in to the admin panel, open an approved allergen, add a full
// ingredient term, edit it, and delete it; the term list refreshes after
// every operation and the pending-allergen queue still works.
test('manages an approved allergen term while the pending queue stays available', async ({ page }) => {
  const client = createDbClient();
  await client.connect();

  try {
    const allergen = await createApprovedAllergen(client);

    await loginAsAdmin(page);
    await page.goto('/allergens');

    await expect(page.getByRole('heading', { name: allergen.name })).toBeVisible();
    await expect(page.getByText('Fila de normalização pendente')).toBeVisible();

    await page.getByLabel('New ingredient term').fill('leite integral');
    await page.getByRole('button', { name: 'Adicionar termo' }).click();
    await expect(page.getByText('leite integral')).toBeVisible();

    await page.getByRole('button', { name: 'Editar' }).click();
    const editInput = page.getByLabel('Edit term');
    await editInput.fill('leite de vaca');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText('leite de vaca')).toBeVisible();
    await expect(page.getByText('leite integral')).not.toBeVisible();

    await page.getByRole('button', { name: 'Remover' }).click();
    await expect(page.getByText('leite de vaca')).not.toBeVisible();
    await expect(page.getByText('No ingredient terms yet.')).toBeVisible();

    await expect(page.getByText('No pending allergen terms.')).toBeVisible();
  } finally {
    await client.end();
  }
});
