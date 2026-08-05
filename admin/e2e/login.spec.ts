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
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole('heading', { name: 'Recipe review queue' })).toBeVisible();
});
