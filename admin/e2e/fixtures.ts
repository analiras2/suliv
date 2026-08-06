import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { requireLocalTestDatabaseUrl } from './test-database';

export function createDbClient(): Client {
  return new Client({ connectionString: requireLocalTestDatabaseUrl() });
}

export async function ensureCategoryId(client: Client): Promise<string> {
  const existing = await client.query<{ id: string }>("SELECT id FROM categories WHERE key = 'lanche' LIMIT 1");
  if (existing.rows.length > 0) return existing.rows[0].id;

  const id = randomUUID();
  await client.query(
    "INSERT INTO categories (id, key, label) VALUES ($1, 'lanche', 'Lanche') ON CONFLICT (key) DO NOTHING",
    [id],
  );
  const inserted = await client.query<{ id: string }>("SELECT id FROM categories WHERE key = 'lanche' LIMIT 1");
  return inserted.rows[0].id;
}

export async function createAuthor(client: Client): Promise<string> {
  const id = randomUUID();
  const suffix = randomUUID().replace(/-/g, '').slice(0, 16);
  await client.query('INSERT INTO users (id, email, username) VALUES ($1, $2, $3)', [
    id,
    `author-${suffix}@example.com`,
    `author_${suffix}`,
  ]);
  return id;
}

export interface CreateRecipeOptions {
  authorId: string;
  categoryId: string;
  status?: string;
}

export interface CreatedRecipe {
  id: string;
  slug: string;
  title: string;
}

export async function createRecipe(client: Client, options: CreateRecipeOptions): Promise<CreatedRecipe> {
  const id = randomUUID();
  const suffix = randomUUID().slice(0, 8);
  const slug = `e2e-recipe-${suffix}`;
  const title = `E2E Recipe ${suffix}`;

  await client.query(
    `INSERT INTO recipes (
      id, slug, author_id, title, description, category_id, prep_time_minutes,
      time_bucket, servings, difficulty, diet_preference, status, submitted_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())`,
    [
      id,
      slug,
      options.authorId,
      title,
      'Descrição de teste gerada pelo E2E.',
      options.categoryId,
      15,
      'ate_15',
      2,
      'iniciante',
      'flexitariano',
      options.status ?? 'em_analise',
    ],
  );

  await client.query(
    'INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit, "order") VALUES ($1,$2,$3,$4,$5,$6)',
    [randomUUID(), id, 'Farinha', 2, 'xicara', 1],
  );
  await client.query(
    'INSERT INTO recipe_steps (id, recipe_id, "order", description) VALUES ($1,$2,$3,$4)',
    [randomUUID(), id, 1, 'Misture os ingredientes.'],
  );

  return { id, slug, title };
}

export async function fetchRecipeStatus(client: Client, recipeId: string): Promise<string> {
  const result = await client.query<{ status: string }>('SELECT status FROM recipes WHERE id = $1', [recipeId]);
  return result.rows[0].status;
}

export async function fetchRecipeAdjustment(
  client: Client,
  recipeId: string,
): Promise<{ status: string; adjustmentReason: string | null; adjustmentNote: string | null }> {
  const result = await client.query<{ status: string; adjustment_reason: string | null; adjustment_note: string | null }>(
    'SELECT status, adjustment_reason, adjustment_note FROM recipes WHERE id = $1',
    [recipeId],
  );
  const row = result.rows[0];
  return { status: row.status, adjustmentReason: row.adjustment_reason, adjustmentNote: row.adjustment_note };
}

export interface CreatedAllergen {
  id: string;
  name: string;
}

export async function createApprovedAllergen(client: Client): Promise<CreatedAllergen> {
  const id = randomUUID();
  const suffix = randomUUID().slice(0, 8);
  const name = `E2E Allergen ${suffix}`;

  await client.query(
    "INSERT INTO allergens (id, name, status, created_at, updated_at) VALUES ($1, $2, 'approved', now(), now())",
    [id, name],
  );

  return { id, name };
}

export async function createReport(
  client: Client,
  options: { targetId: string; targetType: 'recipe' | 'comment'; reporterUserId: string },
): Promise<string> {
  const id = randomUUID();
  await client.query(
    'INSERT INTO reports (id, reporter_user_id, target_type, target_id, reason) VALUES ($1,$2,$3,$4,$5)',
    [id, options.reporterUserId, options.targetType, options.targetId, 'conteudo_inadequado'],
  );
  return id;
}
