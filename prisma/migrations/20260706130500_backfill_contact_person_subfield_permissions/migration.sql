WITH contact_name_permissions AS (
	SELECT DISTINCT "role_id", "table", "action"
	FROM "role_field_permission"
	WHERE "table" = 'institution'
		AND "field" IN ('contact_person', 'contact_person.first_name', 'contact_person.last_name')
),
contact_detail_fields(field) AS (
	VALUES
		('contact_person.email'),
		('contact_person.phone')
)
INSERT INTO "role_field_permission" ("role_id", "table", "field", "action")
SELECT permissions."role_id", permissions."table", contact_detail_fields.field, permissions."action"
FROM contact_name_permissions AS permissions
CROSS JOIN contact_detail_fields
ON CONFLICT ("role_id", "table", "field", "action") DO NOTHING;
