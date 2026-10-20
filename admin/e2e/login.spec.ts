import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { CREDENTIALS_FILE } from './global-setup';

// E2E-001: navigate to login, submit correct credentials, redirected to the
// recipe review queue.
test('logs in with correct credentials and reaches the recipe review queue', async ({ page }) => {
  const { email, password } = JSON.parse(await readFile(CREDENTIALS_FILE, 'utf-8')) as {
    email: string;
    password: string;
  };

  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole('heading', { name: 'Fila de revisão de receitas' })).toBeVisible();
});

// mensageria E2E-006: invalid credentials format shows Portuguese field messages for both
// fields (API VALIDATION_FAILED details), never the API's English text.
test('shows Portuguese field messages for an invalid e-mail and an empty password', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('x');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page.getByTestId('email-error')).toHaveText('Informe um e-mail válido.');
  await expect(page.getByTestId('password-error')).toHaveText('Preencha este campo.');
  await expect(page).toHaveURL(/\/login$/);
});

// The API answers wrong credentials with ADMIN_INVALID_CREDENTIALS; the panel shows its own copy.
test('shows the Portuguese invalid-credentials copy for a wrong password', async ({ page }) => {
  const { email } = JSON.parse(await readFile(CREDENTIALS_FILE, 'utf-8')) as { email: string };

  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('definitely-the-wrong-password');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page.locator('p[role="alert"]')).toHaveText('E-mail ou senha inválidos.');
});

