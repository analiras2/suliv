-- CreateEnum
CREATE TYPE "DietPreference" AS ENUM ('vegano', 'vegetariano', 'flexitariano');

-- CreateEnum
CREATE TYPE "CookingLevel" AS ENUM ('iniciante', 'intermediario', 'avancado');

-- CreateEnum
CREATE TYPE "CookingFrequency" AS ENUM ('raramente', 'algumas_vezes_semana', 'quase_todo_dia');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'anonymized');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "username_updated_at" TIMESTAMP(3),
    "avatar_url" TEXT,
    "diet_preference" "DietPreference",
    "cooking_level" "CookingLevel",
    "cooking_frequency" "CookingFrequency",
    "onboarding_completed_at" TIMESTAMP(3),
    "terms_version_accepted" TEXT,
    "terms_accepted_at" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
