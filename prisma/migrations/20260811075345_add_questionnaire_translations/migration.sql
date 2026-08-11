-- AlterTable
ALTER TABLE "question" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "label_en" TEXT;

-- AlterTable
ALTER TABLE "questionnaire" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "title_en" TEXT;
