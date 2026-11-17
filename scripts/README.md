# Traduora Sync

Sync local translations with Traduora.

## Commands

```bash
npm run traduora:push
npm run traduora:pull
```

```bash
npm run traduora:push -- --all
npm run traduora:push -- --all --prune
npm run traduora:pull -- --all
```

`npm run traduora:sync -- <push|pull>` runs the same script with the action as an
argument; the nightly `sync-traduora.yml` workflow uses it.

## Flags

- `--all`: on pull, remote values overwrite local ones (by default local values are kept).
  On push with `--prune`, reset remote terms before importing local files.
- `--prune`: on push, delete remote terms that no longer exist locally. Combined
  with `--all`, deletes all remote terms first, then imports the local files.
- `--yes`: skip the confirmation before a push. Required where there is no terminal,
  such as CI.
- `--bulk`: push through a single `jsonflat` import instead of term by term.

## Data Model

Traduora terms are fully qualified i18n keys. Push uploads local files through
Traduora's `jsonflat` import format, because some Traduora instances return 404
for `jsonnested` imports.

```text
common.auth.login
content.downloadModal.title
enumMap.field_names.status.options.public
```

The local file keeps the namespace grouping for readability:

```text
src/lib/i18n/translations/
├── de/translation.json
└── en/translation.json
```

Each `translation.json` is shaped as:

```json
{
	"common": {},
	"content": {},
	"enumMap": {}
}
```

The application uses the single i18next namespace `translation`. The top-level
`common`, `content`, and `enumMap` keys are part of the translation key path.

## Environment Variables

Required in `.env`:

- `TRADUORA_API_URL`
- `TRADUORA_CLIENT_ID`
- `TRADUORA_CLIENT_SECRET`
- `TRADUORA_PROJECT_ID`

# E2E Seed

`seed-e2e.ts` fills a local Supabase (auth) and Postgres with synthetic test data:
three users (active, admin, banned), guest/member/admin roles with permissions,
120 public institutions, and two submissions. All data is invented — never copy
real records into it. It wipes the tables it fills and refuses to run unless
`SUPABASE_URL` and `DATABASE_URL` point to localhost.

```bash
supabase start                      # uses supabase/config.toml
eval "$(supabase status -o env)"
export SUPABASE_URL=$API_URL DATABASE_URL=$DB_URL \
  SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
npx prisma migrate deploy && npm run data:migrate
eval "$(npm run -s seed:e2e)"      # seeds and exports the E2E_* values
```

CI runs the same steps in the `e2e` job of `.github/workflows/ci.yml`.

# Other Scripts

- `npm run data:migrate` (`run-data-migrations.ts`): applies data migrations, see
  [`data-migrations/README.md`](../data-migrations/README.md).
- `npm run i18n:audit` (`i18n-audit.ts`): reports keys used in the code but missing in
  the translation files, keys that differ between locales, and unused keys.
- `npm run email:dispatch` (`process-email-outbox.ts`): sends queued transactional emails
  from the email outbox.
