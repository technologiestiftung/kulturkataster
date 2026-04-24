-- CreateEnum
CREATE TYPE "EmailTemplateKind" AS ENUM ('auth', 'custom');

-- CreateTable
CREATE TABLE "email_template" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "kind" "EmailTemplateKind" NOT NULL DEFAULT 'custom',
    "name" TEXT,
    "description" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "text" TEXT,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_template_audience" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "role_id" INTEGER,
    "group_id" INTEGER,
    "metadata" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_template_audience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_template_key_key" ON "email_template"("key");

-- CreateIndex
CREATE UNIQUE INDEX "email_template_path_key" ON "email_template"("path");

-- CreateIndex
CREATE INDEX "email_template_kind_idx" ON "email_template"("kind");

-- CreateIndex
CREATE INDEX "email_template_is_active_idx" ON "email_template"("is_active");

-- CreateIndex
CREATE INDEX "email_template_audience_template_id_idx" ON "email_template_audience"("template_id");

-- CreateIndex
CREATE INDEX "email_template_audience_role_id_idx" ON "email_template_audience"("role_id");

-- CreateIndex
CREATE INDEX "email_template_audience_group_id_idx" ON "email_template_audience"("group_id");

-- CreateIndex
CREATE INDEX "email_template_audience_priority_idx" ON "email_template_audience"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "email_template_audience_template_id_role_id_group_id_key" ON "email_template_audience"("template_id", "role_id", "group_id");

-- AddForeignKey
ALTER TABLE "email_template_audience" ADD CONSTRAINT "email_template_audience_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template_audience" ADD CONSTRAINT "email_template_audience_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template_audience" ADD CONSTRAINT "email_template_audience_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
