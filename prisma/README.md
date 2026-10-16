# Prisma

The database is the Postgres of a Supabase project. Prisma manages the schema in
`public` and is used for all database access from the server. Supabase provides
authentication (`auth.users`) and file storage.

`prisma/schema.prisma` is the source of truth for models and enums; this file only
gives an overview.

## Database Connection

`prisma.config.ts` reads `DATABASE_URL` from `.env` (via `dotenv`). For a local Supabase
started with `supabase start`, that is:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

The `*:local` script variants read `.env.local` instead.

## Available Scripts

```bash
npm run prisma:generate   # Generate the client into src/generated/prisma
npm run prisma:migrate    # Create and apply a migration (prisma migrate dev)
npm run prisma:push       # Push the schema without a migration (prototyping only)
npm run prisma:pull       # Pull the schema from the database
npm run prisma:studio     # Browse the data
```

`npm run build` runs `prisma generate` before `next build`.

## Schema vs Data Migrations

- Schema changes: edit `schema.prisma`, run `npm run prisma:migrate`, and commit the new
  folder in `prisma/migrations/`.
- Data changes (seed rows, backfills, questionnaire content): add a file to
  `data-migrations/`, see [`data-migrations/README.md`](../data-migrations/README.md).

Order on a database:

```bash
npx prisma migrate deploy   # schema; also creates the app_data_migrations table
npm run data:migrate        # data
```

The release workflow runs `prisma migrate deploy` on each deployment. Data migrations are
not part of it yet and are applied separately.

## Schema Overview

- **Places**: `Institution` with `Address` (coordinates as `lat`/`lng` doubles),
  `ContactPerson` and `FundingSource`
- **Classification**: `Category` (a parent category or a subcategory via
  `parent_category_id`) and `Tag`, both linked to places many-to-many
- **Users and access**: `User` (linked to `auth.users` by ID), `Group`, `Role`,
  `RoleTablePermission`, `RoleFieldPermission` and `PermissionFieldOrder`
- **Submissions**: `Submission` and `SubmissionNote` for suggestions and updates that are
  reviewed before they go live
- **Questionnaire**: `Questionnaire`, `Question` and `Answer`
- **Email**: `EmailTemplate`, `EmailTemplateAudience` and `EmailOutbox`
- **Audit**: `EntityAudit`, written by the audit extension of the Prisma client
- **Tracking**: `AppDataMigration` (`app_data_migrations`) for applied data migrations

## Using Prisma in Code

Use the shared client from `src/server/prisma.ts`. It uses the `pg` driver adapter and
the audit extension, so don't create another `PrismaClient`.

```ts
import { prisma } from "@/server/prisma";

const institutions = await prisma.institution.findMany({
	include: { address: true, categories: true },
});
```

Database access is grouped in repositories in `src/server/data/`. Prisma runs on the
server only.

## Supabase Auth and Users

Supabase Auth owns sign-up, login and sessions. When a user registers, the app creates
a matching row in `public."user"` with the same ID (see `src/server/actions/auth.ts`).
Roles, groups and permissions live in Prisma.

## Storage

- `FILE_STORAGE_BUCKET` (default `icons`): general file storage
  (`src/server/supabase/storage.ts`)
- `SUPABASE_CATEGORY_ICONS_BUCKET` (default `category-icons`): category icons uploaded
  in the account area

## Troubleshooting

- **Connection errors**: check `DATABASE_URL` and that `supabase start` is running.
- **Types out of date**: run `npm run prisma:generate` and restart the TypeScript server.
- **Migration drift**: compare `prisma/migrations/` with the `_prisma_migrations` table;
  never edit a migration that has already been applied.

## Resources

- [Prisma documentation](https://www.prisma.io/docs)
- [Supabase with Prisma](https://supabase.com/docs/guides/database/prisma)
