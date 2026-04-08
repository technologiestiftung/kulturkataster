# Traduora Sync Scripts

Sync translation files between local JSON files and Traduora.

## Commands

### Basic Commands

```bash
# Push local translations to Traduora (new keys only)
npm run traduora:push

# Pull translations from Traduora to local files (new keys only)
npm run traduora:pull
```

### Advanced Push Options

```bash
# Overwrite all translations in Traduora with local values
npm run traduora:push -- --all

# Mirror local files: overwrite translations AND delete remote keys missing locally
npm run traduora:push -- --all --prune

# Full mirror: also delete orphan namespaces (labels with no matching local file)
npm run traduora:push -- --all --prune --prune-orphan-namespaces
```

### Advanced Pull Options

```bash
# Overwrite all local translations with Traduora values
npm run traduora:pull -- --all
```

### Flag Reference

**Push Flags:**

- `--all` - Overwrite existing translations (default: only add new keys)
- `--prune` - Delete remote terms that don't exist in local files
- `--prune-orphan-namespaces` - Delete namespaces/labels with no matching local file

**Pull Flags:**

- `--all` - Overwrite local values with Traduora (default: preserve local values, only add new keys)

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
