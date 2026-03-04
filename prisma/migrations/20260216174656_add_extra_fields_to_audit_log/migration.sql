-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('approval_pending', 'approved', 'rejected', 'completed');

-- AlterTable
ALTER TABLE "entity_audit" ADD COLUMN     "meta_info" JSONB,
ADD COLUMN     "status" "ActivityStatus" NOT NULL DEFAULT 'approval_pending';
