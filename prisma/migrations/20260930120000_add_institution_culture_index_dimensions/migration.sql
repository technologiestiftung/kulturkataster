-- AlterTable
ALTER TABLE "institution" ADD COLUMN     "culture_index_location" DOUBLE PRECISION,
ADD COLUMN     "culture_index_property" DOUBLE PRECISION,
ADD COLUMN     "culture_index_financial" DOUBLE PRECISION,
ADD COLUMN     "culture_index_social_spatial" DOUBLE PRECISION,
ADD COLUMN     "culture_index_visibility" DOUBLE PRECISION,
ADD COLUMN     "culture_index_global" TEXT;

-- The dimensions are as sensitive as the index itself, so they inherit its permissions.
WITH culture_index_permissions AS (
	SELECT DISTINCT "role_id", "table", "action"
	FROM "role_field_permission"
	WHERE "table" = 'institution'
		AND "field" = 'culture_index'
)
INSERT INTO "role_field_permission" ("role_id", "table", "field", "action")
SELECT permissions."role_id", permissions."table", dimensions."field", permissions."action"
FROM culture_index_permissions AS permissions
CROSS JOIN (
	VALUES
		('culture_index_location'),
		('culture_index_property'),
		('culture_index_financial'),
		('culture_index_social_spatial'),
		('culture_index_visibility'),
		('culture_index_global')
) AS dimensions("field")
ON CONFLICT ("role_id", "table", "field", "action") DO NOTHING;
