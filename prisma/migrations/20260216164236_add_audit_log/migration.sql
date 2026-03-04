-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM (
    'institution',
    'address',
    'contact_person',
    'category',
    'tag',
    'funding_source',
    'user',
    'role',
    'group',
    'submission',
    'role_table_permission',
    'role_field_permission'
);

-- CreateTable
CREATE TABLE "entity_audit" (
    "id" SERIAL NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" "AuditEntityType" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "changed_by" UUID,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entity_audit_entity_id_idx" ON "entity_audit"("entity_id");

-- CreateIndex
CREATE INDEX "entity_audit_entity_type_idx" ON "entity_audit"("entity_type");

-- CreateIndex
CREATE INDEX "entity_audit_action_idx" ON "entity_audit"("action");

-- CreateIndex
CREATE INDEX "entity_audit_changed_by_idx" ON "entity_audit"("changed_by");

-- CreateIndex
CREATE INDEX "entity_audit_changed_at_idx" ON "entity_audit"("changed_at");

-- AddForeignKey
ALTER TABLE "entity_audit" ADD CONSTRAINT "entity_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
