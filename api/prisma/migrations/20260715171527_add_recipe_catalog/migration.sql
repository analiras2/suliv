-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('cafe_da_manha', 'almoco_jantar', 'lanche', 'sobremesa', 'bebida', 'molhos_acompanhamentos');

-- CreateEnum
CREATE TYPE "TimeBucket" AS ENUM ('ate_15', 'quinze_30', 'trinta_60', 'sessenta_mais');

-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('rascunho', 'em_analise', 'aprovada', 'precisa_de_ajustes', 'removida');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('ingrediente_ambiguo', 'passo_confuso', 'falta_foto', 'foto_baixa_qualidade', 'tempo_porcao_incoerente', 'conteudo_inadequado', 'outro');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "key" "RecipeCategory" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_key_key" ON "categories"("key");

-- AlterTable
ALTER TABLE "recipes"
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "description" TEXT,
    ADD COLUMN "cover_image_url" TEXT,
    ADD COLUMN "category_id" TEXT,
    ADD COLUMN "prep_time_minutes" INTEGER,
    ADD COLUMN "time_bucket" "TimeBucket",
    ADD COLUMN "servings" INTEGER,
    ADD COLUMN "difficulty" "CookingLevel",
    ADD COLUMN "diet_preference" "DietPreference",
    ADD COLUMN "status" "RecipeStatus" NOT NULL DEFAULT 'rascunho',
    ADD COLUMN "current_version" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "adjustment_reason" "AdjustmentReason",
    ADD COLUMN "adjustment_note" TEXT,
    ADD COLUMN "author_message_to_moderator" TEXT,
    ADD COLUMN "terms_version_accepted" TEXT,
    ADD COLUMN "submitted_at" TIMESTAMP(3),
    ADD COLUMN "approved_at" TIMESTAMP(3),
    ADD COLUMN "removed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "recipe_daily_stats" (
    "recipe_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "favorites_added" INTEGER NOT NULL DEFAULT 0,
    "cook_completions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_daily_stats_pkey" PRIMARY KEY ("recipe_id","date")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes"("slug");

-- CreateIndex
CREATE INDEX "recipes_status_idx" ON "recipes"("status");

-- CreateIndex
CREATE INDEX "recipes_category_id_status_idx" ON "recipes"("category_id", "status");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_daily_stats" ADD CONSTRAINT "recipe_daily_stats_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill required columns is unnecessary: `recipes` has 0 rows at migration time.
-- Enforce NOT NULL now that the table is guaranteed empty (no backfill needed).
ALTER TABLE "recipes"
    ALTER COLUMN "slug" SET NOT NULL,
    ALTER COLUMN "description" SET NOT NULL,
    ALTER COLUMN "category_id" SET NOT NULL,
    ALTER COLUMN "prep_time_minutes" SET NOT NULL,
    ALTER COLUMN "time_bucket" SET NOT NULL,
    ALTER COLUMN "servings" SET NOT NULL,
    ALTER COLUMN "difficulty" SET NOT NULL,
    ALTER COLUMN "diet_preference" SET NOT NULL;
