/*
  Warnings:

  - The `institution_claims` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'banned';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
DROP COLUMN "institution_claims",
ADD COLUMN     "institution_claims" TEXT[];
