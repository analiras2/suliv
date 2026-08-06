import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './auth';
import {
  createApprovedAllergen,
  createDbClient,
  createPendingAllergen,
} from './fixtures';

// E2E-004: sign in to the admin panel, open an approved allergen, add a full
// ingredient term, edit it, and delete it; the term list refreshes after
// every operation and the pending-allergen queue still works.
test('manages an approved allergen term while the pending queue stays available', async ({ page }) => {
  const client = createDbClient();
  await client.connect();

  try {
    const allergen = await createApprovedAllergen(client);
    const pendingAllergen = await createPendingAllergen(client);

    await loginAsAdmin(page);
    await page.goto('/allergens');

    const approvedAllergenEditor = page
      .getByRole('heading', { name: allergen.name })
      .locator('..');
    const pendingAllergenRow = page
      .getByRole('listitem')
      .filter({ hasText: pendingAllergen.name });

    await expect(approvedAllergenEditor).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Fila de normalização pendente' }),
    ).toBeVisible();
    await expect(pendingAllergenRow).toBeVisible({ timeout: 15_000 });

    await approvedAllergenEditor.getByLabel('New ingredient term').fill('leite integral');
    await approvedAllergenEditor.getByRole('button', { name: 'Adicionar termo' }).click();

    const termRow = approvedAllergenEditor
      .locator(':scope > ul > li')
      .filter({ hasText: 'leite integral' });
    await expect(termRow).toBeVisible();
    await termRow.getByRole('button', { name: 'Editar' }).click();
    const editInput = approvedAllergenEditor.getByLabel('Edit term');
    await editInput.fill('leite de vaca');
    await approvedAllergenEditor.getByRole('button', { name: 'Salvar' }).click();

    const updatedTermRow = approvedAllergenEditor
      .locator(':scope > ul > li')
      .filter({ hasText: 'leite de vaca' });
    await expect(updatedTermRow).toBeVisible();
    await expect(termRow).not.toBeVisible();
    await updatedTermRow.getByRole('button', { name: 'Remover' }).click();
    await expect(updatedTermRow).not.toBeVisible();
    await expect(approvedAllergenEditor.getByText('No ingredient terms yet.')).toBeVisible();

    await pendingAllergenRow.getByRole('button', { name: 'Aprovar' }).click();
    await expect(pendingAllergenRow).not.toBeVisible();
  } finally {
    await client.end();
  }
});
