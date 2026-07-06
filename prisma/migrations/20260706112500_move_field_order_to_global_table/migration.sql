CREATE TABLE IF NOT EXISTS "permission_field_order" (
	"id" SERIAL NOT NULL,
	"table" TEXT NOT NULL,
	"field" TEXT NOT NULL,
	"sort_order" INTEGER NOT NULL,

	CONSTRAINT "permission_field_order_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "permission_field_order_table_field_key"
ON "permission_field_order" ("table", "field");

CREATE INDEX IF NOT EXISTS "permission_field_order_table_idx"
ON "permission_field_order" ("table");

WITH default_order(field, sort_order) AS (
	VALUES
		('status', 0),
		('name', 1),
		('parent_organization', 2),
		('email', 3),
		('phone', 4),
		('website', 5),
		('address', 6),
		('categories', 7),
		('tags', 8),
		('utilization_status', 9),
		('utilization_status_info', 10),
		('utilization_status_internal_notes', 11),
		('protection_status', 12),
		('protection_status_info', 13),
		('protection_status_internal_notes', 14),
		('legal_form', 15),
		('funding_sources', 16),
		('funding_type', 17),
		('owner_name', 18),
		('owner_type', 19),
		('rental_contract_type', 20),
		('rental_contract_end', 21),
		('established_since', 22),
		('established_until', 23),
		('closing_reason', 24),
		('area', 25),
		('number_of_rooms', 26),
		('capacity', 27),
		('shared_use_allowed', 28),
		('shared_use_info', 29),
		('shared_use_equipment', 30),
		('shared_use_audience', 31),
		('shared_use_availability', 32),
		('accessibility', 33),
		('cost', 34),
		('shared_use_contact_person', 35),
		('contact_person', 36),
		('notes', 37),
		('internal_notes', 38),
		('source', 39),
		('groups', 40),
		('users', 41),
		('import_identifier', 42),
		('created_at', 43),
		('updated_at', 44)
)
INSERT INTO "permission_field_order" ("table", "field", "sort_order")
SELECT 'institution', field, sort_order
FROM default_order
ON CONFLICT ("table", "field") DO UPDATE
SET "sort_order" = EXCLUDED."sort_order";

ALTER TABLE "role_field_permission"
DROP COLUMN IF EXISTS "sort_order";
