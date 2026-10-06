-- Bare pantry name used for allergen matching; NULL falls back to "name".
ALTER TABLE "recipe_ingredients" ADD COLUMN IF NOT EXISTS "canonical_name" TEXT;
