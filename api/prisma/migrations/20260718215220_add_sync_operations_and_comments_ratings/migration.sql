-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('visible', 'hidden');

-- CreateTable
CREATE TABLE "sync_operations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments_ratings" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment_text" TEXT,
    "status" "CommentStatus" NOT NULL DEFAULT 'visible',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sync_operations_user_id_idempotency_key_key" ON "sync_operations"("user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "comments_ratings_recipe_id_user_id_key" ON "comments_ratings"("recipe_id", "user_id");
