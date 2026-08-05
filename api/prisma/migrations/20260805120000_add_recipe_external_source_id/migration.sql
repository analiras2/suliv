-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "external_source_id" TEXT,
ADD COLUMN     "external_nutrition_data" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "recipes_external_source_id_key" ON "recipes"("external_source_id");
