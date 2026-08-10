-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('draft', 'open', 'closed', 'archived');

-- CreateTable
CREATE TABLE "questionnaire" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'draft',
    "meta_data" JSONB,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" SERIAL NOT NULL,
    "questionnaire_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "field_type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "step" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer" (
    "id" SERIAL NOT NULL,
    "questionnaire_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "institution_id" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "created_by" UUID,
    "submitter_name" TEXT,
    "submitter_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questionnaire_status_idx" ON "questionnaire"("status");

-- CreateIndex
CREATE INDEX "questionnaire_created_by_idx" ON "questionnaire"("created_by");

-- CreateIndex
CREATE INDEX "questionnaire_updated_by_idx" ON "questionnaire"("updated_by");

-- CreateIndex
CREATE INDEX "question_questionnaire_id_step_order_idx" ON "question"("questionnaire_id", "step", "order");

-- CreateIndex
CREATE UNIQUE INDEX "question_questionnaire_id_key_key" ON "question"("questionnaire_id", "key");

-- CreateIndex
CREATE INDEX "answer_questionnaire_id_institution_id_question_id_created__idx" ON "answer"("questionnaire_id", "institution_id", "question_id", "created_at");

-- CreateIndex
CREATE INDEX "answer_question_id_idx" ON "answer"("question_id");

-- CreateIndex
CREATE INDEX "answer_institution_id_idx" ON "answer"("institution_id");

-- AddForeignKey
ALTER TABLE "questionnaire" ADD CONSTRAINT "questionnaire_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire" ADD CONSTRAINT "questionnaire_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
