-- CreateTable
CREATE TABLE "allergen_ingredient_terms" (
    "id" TEXT NOT NULL,
    "allergen_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "normalized_term" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergen_ingredient_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allergen_ingredient_terms_normalized_term_idx" ON "allergen_ingredient_terms"("normalized_term");

-- CreateIndex
CREATE UNIQUE INDEX "allergen_ingredient_terms_allergen_id_normalized_term_key" ON "allergen_ingredient_terms"("allergen_id", "normalized_term");

-- AddForeignKey
ALTER TABLE "allergen_ingredient_terms" ADD CONSTRAINT "allergen_ingredient_terms_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: "recipe_allergens" predates FK enforcement, so a row can
-- reference a recipe_id/allergen_id that no longer exists. Remove any such
-- orphans before the constraints below can be added (see ADR-002 and the
-- TechSpec "Known Risks" mitigation for adding FKs to an existing join table).
DELETE FROM "recipe_allergens"
WHERE NOT EXISTS (SELECT 1 FROM "recipes" WHERE "recipes"."id" = "recipe_allergens"."recipe_id")
   OR NOT EXISTS (SELECT 1 FROM "allergens" WHERE "allergens"."id" = "recipe_allergens"."allergen_id");

-- AddForeignKey
ALTER TABLE "recipe_allergens" ADD CONSTRAINT "recipe_allergens_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_allergens" ADD CONSTRAINT "recipe_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
