-- AlterTable
ALTER TABLE "institution" ALTER COLUMN "shared_use_allowed" DROP NOT NULL;
ALTER TABLE "institution" ALTER COLUMN "shared_use_allowed" DROP DEFAULT;
