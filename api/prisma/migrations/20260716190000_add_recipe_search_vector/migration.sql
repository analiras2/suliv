-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "search_vector" tsvector;

-- Postgres generated columns cannot reference another table's column, and
-- search_vector depends on the joined categories.label (ADR-002), so it is
-- kept in sync via triggers instead of a native GENERATED ALWAYS AS column.
-- Scope is title + categories.label only (ADR-002) — never recipe_ingredients,
-- which doesn't exist and is explicitly out of scope for this feature.

-- CreateFunction
CREATE OR REPLACE FUNCTION recipes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'portuguese',
    coalesce(NEW.title, '') || ' ' || coalesce(
      (SELECT "label" FROM "categories" WHERE "id" = NEW.category_id),
      ''
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER recipes_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, category_id ON "recipes"
FOR EACH ROW EXECUTE FUNCTION recipes_search_vector_update();

-- CreateFunction
CREATE OR REPLACE FUNCTION categories_search_vector_sync() RETURNS trigger AS $$
BEGIN
  UPDATE "recipes"
  SET search_vector = to_tsvector(
    'portuguese',
    coalesce(title, '') || ' ' || coalesce(NEW.label, '')
  )
  WHERE category_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER categories_search_vector_trigger
AFTER UPDATE OF label ON "categories"
FOR EACH ROW EXECUTE FUNCTION categories_search_vector_sync();

-- Backfill existing rows
UPDATE "recipes" r
SET search_vector = to_tsvector(
  'portuguese',
  coalesce(r.title, '') || ' ' || coalesce(c.label, '')
)
FROM "categories" c
WHERE c.id = r.category_id;

-- CreateIndex
CREATE INDEX "recipes_search_vector_idx" ON "recipes" USING GIN ("search_vector");
