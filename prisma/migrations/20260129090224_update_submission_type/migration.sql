/*
  Warnings:

  - The values [review] on the enum `Action` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `institution_claims` on the `user` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Action_new" AS ENUM ('read', 'create', 'update', 'delete');
ALTER TABLE "role_table_permission" ALTER COLUMN "action" TYPE "Action_new" USING ("action"::text::"Action_new");
ALTER TABLE "role_field_permission" ALTER COLUMN "action" TYPE "Action_new" USING ("action"::text::"Action_new");
ALTER TYPE "Action" RENAME TO "Action_old";
ALTER TYPE "Action_new" RENAME TO "Action";
DROP TYPE "public"."Action_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubmissionType" ADD VALUE 'read';
ALTER TYPE "SubmissionType" ADD VALUE 'claim';
ALTER TYPE "SubmissionType" ADD VALUE 'delete';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "institution_claims";
