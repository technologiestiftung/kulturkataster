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
npx prisma migrate deploy
npm run data:migrate
```

The runner automatically creates and maintains the `app_data_migrations` tracking table.
