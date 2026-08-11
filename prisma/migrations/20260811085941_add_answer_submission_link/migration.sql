-- AlterTable
ALTER TABLE "answer" ADD COLUMN     "submission_id" INTEGER,
ALTER COLUMN "institution_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "answer_questionnaire_id_submission_id_question_id_created_a_idx" ON "answer"("questionnaire_id", "submission_id", "question_id", "created_at");

-- CreateIndex
CREATE INDEX "answer_submission_id_idx" ON "answer"("submission_id");

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exactly one of institution_id/submission_id must be set: institution_id targets an
-- already-approved Institution, submission_id targets a still-pending Submission
-- (e.g. someone answering the questionnaire for an institution they just proposed).
-- Prisma has no native @@check attribute, so this is hand-added (see the email_outbox
-- migration for the precedent of a manually-added CHECK constraint in this codebase).
-- Note: "one completed questionnaire per institution/submission" is deliberately NOT
-- enforced here at the DB level — that business rule lives in the server action
-- (answerRepo.hasAnswered), see submitQuestionnaireAnswers.
ALTER TABLE "answer" ADD CONSTRAINT "answer_institution_xor_submission_check" CHECK (
	(institution_id IS NOT NULL AND submission_id IS NULL) OR
	(institution_id IS NULL AND submission_id IS NOT NULL)
);
