-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('private', 'federal_property', 'state_property', 'state_property_silb', 'state_property_soda', 'state_property_other', 'state_property_specialized', 'state_property_fund', 'district_property', 'other_public_property', 'municipal_housing_company', 'other');

-- CreateEnum
CREATE TYPE "RentalContractType" AS ENUM ('unlimited_lease', 'limited_lease', 'hereditary_building_right', 'organization_ownership');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('workspace_program', 'institutional_funding', 'temporary_project_funding', 'no_funding');

-- CreateEnum
CREATE TYPE "UtilizationStatus" AS ENUM ('in_use', 'temporarily_closed', 'permanently_closed', 'planned_use', 'unknown', 'potential_space');

-- CreateEnum
CREATE TYPE "ProtectionStatus" AS ENUM ('long_term_secured', 'medium_term_secured', 'uncertain', 'acutely_threatened', 'permanently_closed', 'not_yet_secured');

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('public', 'private', 'archived', 'draft', 'removal_pending');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'pending');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('active', 'pending', 'inactive');

-- CreateEnum
CREATE TYPE "FieldAction" AS ENUM ('read', 'write', 'edit', 'delete');

-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('create', 'update', 'delete');

-- CreateTable
CREATE TABLE "address" (
    "id" SERIAL NOT NULL,
    "street" TEXT NOT NULL,
    "street_number" TEXT,
    "address_suffix" TEXT,
    "zipcode" TEXT,
    "city" TEXT,
    "district" TEXT,
    "neighbourhood" TEXT,
    "cultural_area" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_person" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "area" DOUBLE PRECISION,
    "number_of_rooms" INTEGER,
    "parent_organization" TEXT,
    "legal_form" TEXT,
    "capacity" INTEGER,
    "owner_name" TEXT,
    "owner_type" "OwnerType",
    "rental_contract_type" "RentalContractType",
    "rental_contract_end" TIMESTAMP(3),
    "funding_type" "FundingType",
    "utilization_status" "UtilizationStatus",
    "utilization_status_info" TEXT,
    "protection_status" "ProtectionStatus",
    "protection_status_info" TEXT,
    "shared_use_allowed" BOOLEAN NOT NULL DEFAULT false,
    "shared_use_info" TEXT,
    "shared_use_equipment" TEXT,
    "shared_use_audience" TEXT,
    "shared_use_availability" TEXT,
    "accessibility" TEXT,
    "cost" TEXT,
    "established_since" TIMESTAMP(3),
    "established_until" TIMESTAMP(3),
    "closing_reason" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'public',
    "import_identifier" TEXT,
    "source" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "address_id" INTEGER,
    "contact_person_id" INTEGER,
    "shared_use_contact_person_id" TEXT,

    CONSTRAINT "institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_source" (
    "id" SERIAL NOT NULL,
    "institution_id" INTEGER NOT NULL,
    "source_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'active',
    "parent_category_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role_id" INTEGER,
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "compliance" BOOLEAN NOT NULL DEFAULT false,
    "institution_claims" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_permission" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "action" "FieldAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InstitutionToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_InstitutionToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InstitutionToUser" (
    "A" INTEGER NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_InstitutionToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CategoryToInstitution" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryToInstitution_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GroupToUser" (
    "A" INTEGER NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_GroupToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GroupToInstitution" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GroupToInstitution_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "address_lat_idx" ON "address"("lat");

-- CreateIndex
CREATE INDEX "address_lng_idx" ON "address"("lng");

-- CreateIndex
CREATE INDEX "address_lat_lng_idx" ON "address"("lat", "lng");

-- CreateIndex
CREATE INDEX "address_city_idx" ON "address"("city");

-- CreateIndex
CREATE INDEX "address_district_idx" ON "address"("district");

-- CreateIndex
CREATE INDEX "address_neighbourhood_idx" ON "address"("neighbourhood");

-- CreateIndex
CREATE INDEX "address_cultural_area_idx" ON "address"("cultural_area");

-- CreateIndex
CREATE INDEX "address_zipcode_idx" ON "address"("zipcode");

-- CreateIndex
CREATE INDEX "contact_person_email_idx" ON "contact_person"("email");

-- CreateIndex
CREATE INDEX "institution_status_idx" ON "institution"("status");

-- CreateIndex
CREATE INDEX "institution_address_id_idx" ON "institution"("address_id");

-- CreateIndex
CREATE INDEX "institution_contact_person_id_idx" ON "institution"("contact_person_id");

-- CreateIndex
CREATE INDEX "institution_name_idx" ON "institution"("name");

-- CreateIndex
CREATE INDEX "institution_created_by_idx" ON "institution"("created_by");

-- CreateIndex
CREATE INDEX "institution_updated_by_idx" ON "institution"("updated_by");

-- CreateIndex
CREATE INDEX "funding_source_institution_id_idx" ON "funding_source"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_key_key" ON "category"("key");

-- CreateIndex
CREATE INDEX "category_status_idx" ON "category"("status");

-- CreateIndex
CREATE INDEX "category_parent_category_id_idx" ON "category"("parent_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_id_idx" ON "user"("role_id");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "field_permission_role_id_idx" ON "field_permission"("role_id");

-- CreateIndex
CREATE INDEX "field_permission_field_name_idx" ON "field_permission"("field_name");

-- CreateIndex
CREATE UNIQUE INDEX "field_permission_role_id_field_name_action_key" ON "field_permission"("role_id", "field_name", "action");

-- CreateIndex
CREATE UNIQUE INDEX "group_name_key" ON "group"("name");

-- CreateIndex
CREATE INDEX "_InstitutionToTag_B_index" ON "_InstitutionToTag"("B");

-- CreateIndex
CREATE INDEX "_InstitutionToUser_B_index" ON "_InstitutionToUser"("B");

-- CreateIndex
CREATE INDEX "_CategoryToInstitution_B_index" ON "_CategoryToInstitution"("B");

-- CreateIndex
CREATE INDEX "_GroupToUser_B_index" ON "_GroupToUser"("B");

-- CreateIndex
CREATE INDEX "_GroupToInstitution_B_index" ON "_GroupToInstitution"("B");

-- AddForeignKey
ALTER TABLE "institution" ADD CONSTRAINT "institution_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution" ADD CONSTRAINT "institution_contact_person_id_fkey" FOREIGN KEY ("contact_person_id") REFERENCES "contact_person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution" ADD CONSTRAINT "institution_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution" ADD CONSTRAINT "institution_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_source" ADD CONSTRAINT "funding_source_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_permission" ADD CONSTRAINT "field_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToTag" ADD CONSTRAINT "_InstitutionToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToTag" ADD CONSTRAINT "_InstitutionToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToUser" ADD CONSTRAINT "_InstitutionToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToUser" ADD CONSTRAINT "_InstitutionToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToInstitution" ADD CONSTRAINT "_CategoryToInstitution_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToInstitution" ADD CONSTRAINT "_CategoryToInstitution_B_fkey" FOREIGN KEY ("B") REFERENCES "institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToUser" ADD CONSTRAINT "_GroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToUser" ADD CONSTRAINT "_GroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToInstitution" ADD CONSTRAINT "_GroupToInstitution_A_fkey" FOREIGN KEY ("A") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToInstitution" ADD CONSTRAINT "_GroupToInstitution_B_fkey" FOREIGN KEY ("B") REFERENCES "institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

