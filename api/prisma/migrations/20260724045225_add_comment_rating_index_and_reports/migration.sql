-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('recipe', 'comment');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('conteudo_inadequado', 'spam', 'informacao_incorreta_perigosa', 'discurso_odio_assedio', 'outro');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewed');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "free_text" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by_admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporter_user_id_target_type_target_id_key" ON "reports"("reporter_user_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "comments_ratings_recipe_id_status_idx" ON "comments_ratings"("recipe_id", "status");
