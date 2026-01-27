-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'review';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "meta_info" JSONB;
