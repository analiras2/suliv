-- AlterTable: add allergenGroup to ingredients
ALTER TABLE "ingredients" ADD COLUMN "allergen_group" TEXT;
