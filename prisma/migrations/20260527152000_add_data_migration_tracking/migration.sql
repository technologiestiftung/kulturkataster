CREATE TABLE IF NOT EXISTS "app_data_migrations" (
	"id" text PRIMARY KEY,
	"run_at" timestamptz NOT NULL DEFAULT now()
);
