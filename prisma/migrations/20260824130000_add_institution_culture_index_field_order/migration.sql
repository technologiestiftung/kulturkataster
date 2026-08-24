INSERT INTO "permission_field_order" ("table", "field", "sort_order", "is_pinned")
VALUES ('institution', 'culture_index', 20, false)
ON CONFLICT ("table", "field") DO UPDATE SET "sort_order" = EXCLUDED."sort_order";
