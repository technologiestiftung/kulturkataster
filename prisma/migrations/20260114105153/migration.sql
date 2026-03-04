/*
  Warnings:

  - You are about to drop the column `shared_use_contact_person_id` on the `institution` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'invited';

-- AlterTable
ALTER TABLE "institution" DROP COLUMN "shared_use_contact_person_id",
ADD COLUMN     "shared_use_contact_person" TEXT;
