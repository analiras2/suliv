-- Backfills a column that migration 20260805120000 was edited to include
-- *after* that migration had already been applied. Prisma had recorded it as
-- done, so the added DDL never ran — and `migrate status` stayed clean,
-- because it compares migration names, not the DDL inside them.
--
-- IF NOT EXISTS keeps this idempotent: an environment that applied the edited
-- version of 20260805120000 already has the column, and must not fail here.

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "external_nutrition_data" JSONB;
