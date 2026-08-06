import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { hashSync } from 'bcryptjs';
import { Client } from 'pg';
import { requireLocalTestDatabaseUrl } from './test-database';

export const CREDENTIALS_FILE = path.join(__dirname, '.auth', 'admin-credentials.json');

export default async function globalSetup() {
  const email = `admin-e2e-${randomUUID()}@example.com`;
  const password = 'correct-password';
  const passwordHash = hashSync(password, 10);

  const client = new Client({ connectionString: requireLocalTestDatabaseUrl() });
  await client.connect();
  try {
    await client.query('INSERT INTO admins (id, email, password_hash) VALUES ($1, $2, $3)', [
      randomUUID(),
      email,
      passwordHash,
    ]);
  } finally {
    await client.end();
  }

  await mkdir(path.dirname(CREDENTIALS_FILE), { recursive: true });
  await writeFile(CREDENTIALS_FILE, JSON.stringify({ email, password }));
}
