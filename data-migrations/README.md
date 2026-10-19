## Data migrations

This directory is for data-only migrations.

Rules:

- Keep Prisma schema migrations in `prisma/migrations/`.
- Keep data migrations here, versioned with a sortable timestamp prefix.
- Do not mix schema changes into these files.
- Prefer idempotent SQL or TypeScript migrations.
- Run schema migrations first, then data migrations.

Examples:

- `202604291200_seed_default_email_templates.sql`
- `202605011030_backfill_user_slugs.ts`

Execution:

```bash
npm run prisma:generate
npx prisma migrate deploy   # also creates the app_data_migrations tracking table
npm run data:migrate        # uses DATABASE_URL; data:migrate:local reads .env.local
```

- Each applied migration is recorded in `app_data_migrations` and skipped on later runs.
  The ID is the file name without its extension, so renaming a file makes it run again.
- `npm run data:migrate:dry-run` only lists the migration files. It does not connect to
  the database, so it does not show which ones are still pending.
- A `.ts` migration exports a module with an `up(prisma)` function, see `types.ts`.
- The release workflow does not run data migrations yet; apply them after a deployment.
