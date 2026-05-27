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

- `--all`: overwrite existing target values.
- `--prune`: on push, delete remote terms that no longer exist locally.

## Data Model

Traduora terms are fully qualified i18n keys:

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

The application still uses i18next namespaces (`common`, `content`, `enumMap`).
The runtime loader reads the matching top-level object from `translation.json`.

## Environment Variables

Required in `.env`:

- `TRADUORA_API_URL`
- `TRADUORA_CLIENT_ID`
- `TRADUORA_CLIENT_SECRET`
- `TRADUORA_PROJECT_ID`
