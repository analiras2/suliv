-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "recipe_allergens" (
    "recipe_id" TEXT NOT NULL,
    "allergen_id" TEXT NOT NULL,

    CONSTRAINT "recipe_allergens_pkey" PRIMARY KEY ("recipe_id","allergen_id")
);

-- CreateTable
CREATE TABLE "editorial_boosts" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "applied_by_admin_id" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editorial_boosts_pkey" PRIMARY KEY ("id")
);
