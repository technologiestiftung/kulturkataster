ALTER TABLE "permission_field_order"
ADD COLUMN IF NOT EXISTS "is_pinned" BOOLEAN NOT NULL DEFAULT false;

UPDATE "permission_field_order"
SET "is_pinned" = CASE
	WHEN "table" = 'institution' AND "field" IN ('status', 'id', 'name') THEN true
	ELSE false
END;
