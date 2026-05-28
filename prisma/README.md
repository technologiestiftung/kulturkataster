# Prisma Setup for Kulturkataster

This directory contains the Prisma schema and configuration for the Kulturkataster project.

## Database Connection

The project uses **Supabase** as the PostgreSQL database provider.

### Setting up the Database Connection

1. Get your Supabase connection string from your Supabase project:

   - Go to your Supabase project dashboard
   - Navigate to: **Project Settings > Database**
   - Under **Connection String**, select **Direct connection** (not Transaction or Session pooler)
   - Copy the connection string

2. Update the `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```
   Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your actual credentials.

## Available Scripts

The following npm scripts are available for Prisma operations:

- `npm run prisma:generate` - Generate Prisma Client based on the schema
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:migrate` - Create and apply migrations in development
- `npm run prisma:push` - Push schema changes directly to the database (no migration files)
- `npm run prisma:pull` - Pull the current database schema into your Prisma schema
- `npm run data:migrate` - Run versioned data-only migrations after schema deploys

## Schema vs Data Migrations

Use Prisma Migrate for schema changes only:

- `prisma/migrations/` contains Prisma-generated schema migrations
- apply them in production with `npx prisma migrate deploy`

Use `data-migrations/` for data-only changes:

- keep them handwritten in SQL or TypeScript
- version them with sortable timestamp prefixes
- run them with `npm run data:migrate`
- let the runner track applied migrations in `app_data_migrations`, which is
  created by Prisma Migrate

Recommended deployment order:

```bash
npx prisma migrate deploy
npm run data:migrate
npm run build
npm run start
```

## Schema Overview

The schema is designed to work with **Supabase Authentication**. Users are authenticated via Supabase's `auth.users` table, and application data is stored in Prisma-managed tables.

### Core Models

- **Address** - Address information with lat/lng coordinates (Decimal type for precision)
- **ContactPerson** - Contact person details for institutions
- **Institution** - Main institution model with all business fields
- **FundingSource** - One-to-many funding sources for institutions

### Category & Tag System (Implicit Many-to-Many)

- **Category** - Hierarchical categories with parent/child relationships
- **Tag** - Simple tags for institutions
- _No explicit join tables_ - Prisma auto-generates them

### User & Permission System

- **User** - Application user data (synced with Supabase auth.users via UUID)
  - Uses `String @db.Uuid` for `id` to match Supabase auth
  - No `UserRole` enum - roles are dynamic via `Role` table
- **Role** - Dynamic permission roles with JSON permissions field
- **Group** - User and institution groups (implicit many-to-many)
- **FieldPermission** - Field-level permissions tied to roles

### Key Relationships (Implicit Many-to-Many)

All many-to-many relationships use Prisma's implicit syntax (no manual join tables):

- Institution ↔ Category
- Institution ↔ Tag
- Institution ↔ User
- User ↔ Group
- Institution ↔ Group

## Icons via Supabase Storage

Admin-uploaded icons (SVG) should live in Supabase Storage. Store the storage path in the database (e.g. `icon` or `icon_path`), and generate the public URL at read time.

Example path: `category-icons/<uuid>.svg`

```ts
import { FILE_STORAGE_BUCKET } from "@/lib/supabase/storage";

const { data } = supabase.storage
	.from(FILE_STORAGE_BUCKET)
	.getPublicUrl(iconPath);
const publicUrl = data.publicUrl;
```

Use `FILE_STORAGE_BUCKET` to configure the bucket name at runtime (defaults to `icons`).
Expose it to clients via a server action if needed.

## Enums

The following enums are defined:

- `OwnerType` - private, federal*property, state_property*\*, district_property, etc.
- `RentalContractType` - unlimited_lease, limited_lease, hereditary_building_right, organization_ownership
- `FundingType` - workspace_program, institutional_funding, temporary_project_funding, no_funding
- `UtilizationStatus` - in_use, temporarily_closed, permanently_closed, planned_use, unknown, potential_space
- `ProtectionStatus` - long_term_secured, medium_term_secured, uncertain, acutely_threatened, permanently_closed, not_yet_secured
- `InstitutionStatus` - public, private, archived, draft, removal_pending
- `UserStatus` - active, inactive, pending
- `CategoryStatus` - active, pending, inactive
- `FieldAction` - read, write, edit, delete
- `HistoryAction` - create, update, delete

## Supabase + Prisma Integration

This project uses **Supabase for authentication** and **Prisma for database operations**.

### How it works:

1. **Authentication Flow**:

   - User signs up/logs in via Supabase Auth
   - Supabase creates a record in `auth.users` with a UUID
   - Your app creates a matching record in `public.users` (Prisma) with the same UUID

2. **User Management**:

   ```typescript
   // After Supabase sign up
   const {
   	data: { user },
   } = await supabase.auth.signUp({ email, password });

   // Create matching Prisma user record
   await prisma.user.create({
   	data: {
   		id: user.id, // Same UUID from Supabase
   		email: user.email,
   		status: "pending",
   	},
   });
   ```

3. **Querying Data**:
   - Use Supabase SDK for auth operations (login, logout, session management)
   - Use Prisma for all business logic queries (institutions, roles, permissions)

### Benefits:

- Type-safe database queries with Prisma
- Secure authentication with Supabase
- JWT-based sessions
- Row Level Security (RLS) can be used alongside Prisma
- Flexible schema migrations

## Workflow

### Initial Setup

1. Configure your `DATABASE_URL` in `.env` as described above
2. Generate the Prisma Client:
   ```bash
   npm run prisma:generate
   ```

### Development Workflow

#### Option 1: Using Migrations (Recommended for Production)

```bash
# Create and apply a new migration
npm run prisma:migrate

# This will:
# - Create a new migration file in prisma/migrations/
# - Apply the migration to your database
# - Regenerate the Prisma Client
```

#### Option 2: Using Push (Good for Prototyping)

```bash
# Push schema changes directly to the database
npm run prisma:push

# This will:
# - Sync your schema with the database without creating migration files
# - Good for rapid prototyping
# - NOT recommended for production
```

### Viewing Your Data

```bash
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` where you can view and edit your data.

### Pulling Existing Schema

If your database already has tables and you want to generate a Prisma schema from it:

```bash
npm run prisma:pull
```

## Using Prisma in Your Code

### Import the Prisma Client

```typescript
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();
```

### Create a Singleton Instance (Recommended for Next.js)

Create a file `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Then import it in your code:

```typescript
import { prisma } from "@/lib/prisma";

// Example: Get all institutions with related data
const institutions = await prisma.institution.findMany({
	include: {
		address: true,
		categories: true,
		tags: true,
		users: true, // All users associated with this institution
	},
});

// Example: Create a new institution with address
const newInstitution = await prisma.institution.create({
	data: {
		name: "My Institution",
		status: "public",
		address: {
			create: {
				street: "Main Street",
				street_number: "123",
				city: "Berlin",
				zipcode: "10115",
				lat: 52.520008,
				lng: 13.404954,
			},
		},
		categories: {
			connect: [{ id: 1 }, { id: 2 }], // Connect to existing categories
		},
	},
	include: {
		address: true,
		categories: true,
	},
});

// Example: Create a user synced with Supabase
const supabaseUser = { id: "uuid-from-supabase", email: "user@example.com" };

await prisma.user.create({
	data: {
		id: supabaseUser.id, // UUID from Supabase auth.users
		email: supabaseUser.email,
		status: "pending",
	},
});

// Example: Associate a user with institutions
await prisma.user.update({
	where: { id: supabaseUser.id },
	data: {
		institutions: {
			connect: [{ id: 1 }, { id: 2 }], // Connect user to institutions
		},
	},
});
```

## Notes

- The Prisma Client is generated to `src/generated/prisma`
- All models use `created_at` and `updated_at` timestamps
- **User IDs are UUIDs** to match Supabase `auth.users.id`
- **No explicit join tables** - all many-to-many relationships use Prisma's implicit syntax
- Foreign key relationships are properly indexed
- Cascade deletes are set up for related records
- Comments and descriptions are included in the schema
- Address uses `Decimal` type for precise lat/lng coordinates
- All text fields support nullable values for flexibility

## Troubleshooting

### Connection Issues

- Make sure your `DATABASE_URL` is correct in `.env`
- Verify your Supabase project is running
- Check that you're using the **direct connection** string, not the pooler

### Migration Issues

- If migrations fail, check the error message
- You may need to reset the database: `npx prisma migrate reset` (WARNING: This deletes all data)

### Type Issues

- After schema changes, always run `npm run prisma:generate` to update the Prisma Client
- Restart your TypeScript server if types aren't updating

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Next.js with Prisma](https://www.prisma.io/docs/guides/frameworks/nextjs)
