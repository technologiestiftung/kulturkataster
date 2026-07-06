WITH legacy_address_permissions AS (
	SELECT DISTINCT "role_id", "table", "action"
	FROM "role_field_permission"
	WHERE "table" = 'institution'
		AND "field" = 'address'
),
address_fields(field) AS (
	VALUES
		('address.street'),
		('address.address_suffix'),
		('address.zipcode'),
		('address.city'),
		('address.district'),
		('address.neighbourhood'),
		('address.cultural_area')
)
INSERT INTO "role_field_permission" ("role_id", "table", "field", "action")
SELECT permissions."role_id", permissions."table", address_fields.field, permissions."action"
FROM legacy_address_permissions AS permissions
CROSS JOIN address_fields
ON CONFLICT ("role_id", "table", "field", "action") DO NOTHING;

WITH legacy_contact_permissions AS (
	SELECT DISTINCT "role_id", "table", "action"
	FROM "role_field_permission"
	WHERE "table" = 'institution'
		AND "field" = 'contact_person'
),
contact_fields(field) AS (
	VALUES
		('contact_person.first_name'),
		('contact_person.last_name')
)
INSERT INTO "role_field_permission" ("role_id", "table", "field", "action")
SELECT permissions."role_id", permissions."table", contact_fields.field, permissions."action"
FROM legacy_contact_permissions AS permissions
CROSS JOIN contact_fields
ON CONFLICT ("role_id", "table", "field", "action") DO NOTHING;

DELETE FROM "role_field_permission"
WHERE "table" = 'institution'
	AND "field" IN ('address', 'contact_person');

DELETE FROM "permission_field_order"
WHERE "table" = 'institution';

WITH default_order(field, sort_order) AS (
	VALUES
		('status', 0),
		('id', 1),
		('name', 2),
		('parent_organization', 3),
		('email', 4),
		('phone', 5),
		('website', 6),
		('address.street', 7),
		('address.address_suffix', 8),
		('address.zipcode', 9),
		('address.city', 10),
		('address.district', 11),
		('address.neighbourhood', 12),
		('address.cultural_area', 13),
		('address.lat', 14),
		('address.lng', 15),
		('categories', 16),
		('subcategories', 17),
		('tags', 18),
		('utilization_status', 19),
		('utilization_status_info', 20),
		('utilization_status_internal_notes', 21),
		('protection_status', 22),
		('protection_status_info', 23),
		('protection_status_internal_notes', 24),
		('legal_form', 25),
		('funding_sources', 26),
		('funding_type', 27),
		('owner_name', 28),
		('owner_type', 29),
		('rental_contract_type', 30),
		('rental_contract_end', 31),
		('established_since', 32),
		('established_until', 33),
		('closing_reason', 34),
		('area', 35),
		('number_of_rooms', 36),
		('capacity', 37),
		('shared_use_allowed', 38),
		('shared_use_info', 39),
		('shared_use_equipment', 40),
		('shared_use_audience', 41),
		('shared_use_availability', 42),
		('accessibility', 43),
		('cost', 44),
		('shared_use_contact_person', 45),
		('contact_person.first_name', 46),
		('contact_person.last_name', 47),
		('contact_person.email', 48),
		('contact_person.phone', 49),
		('notes', 50),
		('internal_notes', 51),
		('source', 52),
		('groups', 53),
		('users', 54),
		('import_identifier', 55),
		('created_at', 56),
		('updated_at', 57)
)
INSERT INTO "permission_field_order" ("table", "field", "sort_order")
SELECT 'institution', field, sort_order
FROM default_order;
