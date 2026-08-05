-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('moderator', 'admin');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'moderator',

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- DataMigration: the "admins" table is newly created above, so it has no rows yet.
-- Any pre-existing editorial_boosts.applied_by_admin_id value is therefore a dangling
-- soft reference and must be cleared before the FK constraint below can be added.
UPDATE "editorial_boosts" SET "applied_by_admin_id" = NULL WHERE "applied_by_admin_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "editorial_boosts" ADD CONSTRAINT "editorial_boosts_applied_by_admin_id_fkey" FOREIGN KEY ("applied_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
