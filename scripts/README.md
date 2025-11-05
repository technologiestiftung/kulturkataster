# Traduora Sync Scripts

Sync translation files between local JSON files and Traduora.

## Commands

```bash
# Push local translations to Traduora
npm run traduora:push

# Pull translations from Traduora to local files
npm run traduora:pull
```

## How It Works

- **Namespaces = Labels**: `common.json` → "Common" label, `enumMap.json` → "EnumMap" label
- **Safe Merge**: Pull preserves local-only keys (no data loss)
- **Flat ↔ Nested**: `{ "search": { "title": "..." } }` ↔ `search.title`

## Workflow

1. **Add keys locally** → Edit `src/lib/i18n/translations/de/*.json`
2. **Push** → `npm run traduora:push`
3. **Translators work in Traduora**
4. **Pull** → `npm run traduora:pull`
5. **Commit** → `git add src/lib/i18n/translations/`

## GitHub Actions

- **Daily automated pull** at 2 AM UTC
- **Manual trigger** from Actions → "Sync Traduora Translations"

## Environment Variables

Required in `.env`:

- `TRADUORA_API_URL`
- `TRADUORA_CLIENT_ID` (editor permissions required)
- `TRADUORA_CLIENT_SECRET`
- `TRADUORA_PROJECT_ID`

## File Structure

```
src/lib/i18n/translations/
├── de/
│   ├── common.json    → "Common" label
│   ├── content.json   → "Content" label
│   └── enumMap.json   → "EnumMap" label
└── en/
    └── ...
```

## Related Files

- **Sync Script**: `traduora-sync.ts`
- **GitHub Workflow**: `.github/workflows/sync-traduora.yml`
- **i18n Config**: `src/i18n/index.ts`
