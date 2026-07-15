/*
  Warnings:

  - Added the required column `updated_at` to the `user_allergies` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AllergenStatus" AS ENUM ('approved', 'pending');

-- AlterTable
ALTER TABLE "user_allergies" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "allergens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AllergenStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "allergens"("name");

-- AddForeignKey
ALTER TABLE "user_allergies" ADD CONSTRAINT "user_allergies_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
