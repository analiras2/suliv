-- CreateTable
CREATE TABLE "recipe_import_candidates" (
    "id" TEXT NOT NULL,
    "external_source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "RecipeCategory" NOT NULL,
    "prep_time_minutes" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "difficulty" "CookingLevel" NOT NULL,
    "cover_image_url" TEXT,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "external_nutrition_data" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promoted_at" TIMESTAMP(3),

    CONSTRAINT "recipe_import_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_import_candidates_external_source_id_key" ON "recipe_import_candidates"("external_source_id");

-- CreateIndex
CREATE INDEX "recipe_import_candidates_promoted_at_idx" ON "recipe_import_candidates"("promoted_at");
