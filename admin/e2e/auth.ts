import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { CREDENTIALS_FILE } from './global-setup';

export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = JSON.parse(await readFile(CREDENTIALS_FILE, 'utf-8')) as {
    email: string;
    password: string;
  };

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/recipes$/);
}
