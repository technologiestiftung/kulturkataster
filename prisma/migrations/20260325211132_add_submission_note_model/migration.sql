/*
  Warnings:

  - You are about to drop the column `review_notes` on the `submission` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'submission_note';

-- AlterEnum
ALTER TYPE "RentalContractType" ADD VALUE 'leasehold';

-- AlterTable
ALTER TABLE "institution" ADD COLUMN     "utilization_status_internal_notes" TEXT;

-- AlterTable
ALTER TABLE "submission" DROP COLUMN "review_notes";

-- CreateTable
CREATE TABLE "submission_note" (
    "id" SERIAL NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,

    CONSTRAINT "submission_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_note_submission_id_idx" ON "submission_note"("submission_id");

-- CreateIndex
CREATE INDEX "submission_note_created_by_idx" ON "submission_note"("created_by");

-- CreateIndex
CREATE INDEX "submission_note_created_at_idx" ON "submission_note"("created_at");

-- AddForeignKey
ALTER TABLE "submission_note" ADD CONSTRAINT "submission_note_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_note" ADD CONSTRAINT "submission_note_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
