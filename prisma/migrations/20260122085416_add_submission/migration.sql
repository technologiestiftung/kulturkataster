-- CreateEnum
CREATE TYPE "SubmissionEntityType" AS ENUM ('institution', 'category');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('draft', 'approval_pending', 'approved', 'rejected', 'needs_changes');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('create', 'update');

-- CreateTable
CREATE TABLE "submission" (
    "id" SERIAL NOT NULL,
    "entity_type" "SubmissionEntityType" NOT NULL,
    "entity_id" INTEGER,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'draft',
    "type" "SubmissionType" NOT NULL,
    "data" JSONB NOT NULL,
    "diff" JSONB,
    "meta" JSONB,
    "review_notes" TEXT,
    "created_by" UUID,
    "reviewed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_entity_type_idx" ON "submission"("entity_type");

-- CreateIndex
CREATE INDEX "submission_entity_id_idx" ON "submission"("entity_id");

-- CreateIndex
CREATE INDEX "submission_status_idx" ON "submission"("status");

-- CreateIndex
CREATE INDEX "submission_type_idx" ON "submission"("type");

-- CreateIndex
CREATE INDEX "submission_created_by_idx" ON "submission"("created_by");

-- CreateIndex
CREATE INDEX "submission_reviewed_by_idx" ON "submission"("reviewed_by");

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
