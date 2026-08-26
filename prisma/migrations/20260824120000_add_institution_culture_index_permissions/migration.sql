WITH established_since_permissions AS (
	SELECT DISTINCT "role_id", "table", "action"
	FROM "role_field_permission"
	WHERE "table" = 'institution'
		AND "field" = 'established_since'
)
INSERT INTO "role_field_permission" ("role_id", "table", "field", "action")
SELECT permissions."role_id", permissions."table", 'culture_index', permissions."action"
FROM established_since_permissions AS permissions
ON CONFLICT ("role_id", "table", "field", "action") DO NOTHING;
