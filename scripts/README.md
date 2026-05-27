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

## Flags

- `--all`: with `--prune`, reset remote terms before importing local files.
- `--prune`: on push, delete remote terms that no longer exist locally. Combined
  with `--all`, deletes all remote terms first, then imports the local files.

## Data Model

Traduora terms are fully qualified i18n keys. Push uploads local files through
Traduora's `jsonflat` import format, because this deployment returns 404 for
`jsonnested` imports.

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
