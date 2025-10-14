# Traduora Sync Script

This script provides bidirectional synchronization between local i18n files and Traduora translation management system.

## Overview

The sync system:
- Fetches all terms and translations from Traduora using labels as namespaces
- Compares with local JSON translation files
- Identifies differences (new keys, conflicts, missing translations)
- Updates both local files and Traduora to maintain consistency
- Creates pull requests for review when run via GitHub Actions

## Setup

### Environment Variables

Add these environment variables to your `.env` file:

```bash
TRADUORA_API_URL=https://your-traduora-instance/api/v1
TRADUORA_CLIENT_ID=your-client-id
TRADUORA_CLIENT_SECRET=your-client-secret
TRADUORA_PROJECT_ID=your-project-id
```

### GitHub Secrets

For GitHub Actions, add these secrets to your repository:
- `TRADUORA_API_URL`
- `TRADUORA_CLIENT_ID`
- `TRADUORA_CLIENT_SECRET`
- `TRADUORA_PROJECT_ID`

## Usage

### Local Development

Install dependencies:
```bash
npm install
```

Run sync commands:

```bash
# Dry run (preview changes without applying)
npm run sync-traduora:dry

# Full sync (applies changes)
npm run sync-traduora

# Sync specific namespace only
npm run sync-traduora -- --namespace=common
npm run sync-traduora:dry -- --namespace=content
```

### GitHub Actions

The workflow runs automatically:

1. **On Push**: Runs in dry-run mode when translation files change
2. **Manual Trigger**: Can be run manually with options:
   - Dry run mode toggle
   - Specific namespace selection
   - Creates PR with changes if any

## How It Works

### Namespace Mapping

- Traduora **labels** map to local **namespaces** (filenames)
- Example: Label "common" → `src/lib/i18n/translations/{locale}/common.json`

### Sync Process

1. **Authentication**: Uses client credentials to get API token
2. **Fetch Labels**: Gets all available namespaces from Traduora
3. **For each namespace**:
   - Fetches terms filtered by label
   - Fetches translations for all locales
   - Compares with local JSON files
   - Identifies differences
4. **Apply Changes**:
   - Adds missing terms to Traduora
   - Updates local files with new translations
   - Resolves conflicts (local takes precedence)
   - Creates/updates translation entries

### Conflict Resolution

When the same key exists with different values:
- **Local file value takes precedence**
- Remote (Traduora) gets updated with local value
- Conflicts are logged for review

### File Structure

The script expects this directory structure:
```
src/lib/i18n/translations/
├── de/
│   ├── common.json
│   ├── content.json
│   └── enumMap.json
├── en/
│   └── common.json
└── ...
```

## API Integration

### Traduora APIs Used

- `POST /auth/token` - Authentication
- `GET /projects/{id}/labels` - Get namespaces
- `GET /projects/{id}/terms/filter-by-label` - Get terms by namespace
- `GET /projects/{id}/translations/{locale}` - Get translations
- `POST /projects/{id}/terms` - Create new terms
- `PATCH /projects/{id}/translations/{locale}/{termId}` - Update translations

### Rate Limiting

The script handles API rate limits gracefully and includes proper error handling.

## Examples

### Adding New Translation Keys

1. Add to local file:
   ```json
   {
     "newFeature": {
       "title": "New Feature",
       "description": "This is a new feature"
     }
   }
   ```

2. Run sync:
   ```bash
   npm run sync-traduora
   ```

3. Script will:
   - Create terms `newFeature.title` and `newFeature.description` in Traduora
   - Add them to the appropriate label/namespace
   - Upload the German translations

### Updating from Traduora

1. Translator updates values in Traduora interface
2. Run sync:
   ```bash
   npm run sync-traduora
   ```
3. Script will update local files with new translations

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check environment variables
   - Verify client credentials in Traduora

2. **Label Not Found**
   - Ensure labels exist in Traduora
   - Check label names match file names exactly

3. **Network Errors**
   - Check Traduora instance is accessible
   - Verify API URL format

### Debug Mode

Run with additional logging:
```bash
DEBUG=traduora npm run sync-traduora:dry
```

## GitHub Actions Workflow

The workflow provides:
- Automatic sync detection on pushes
- Manual trigger with dry-run option
- Automatic PR creation for changes
- Proper commit messages and descriptions

### Workflow Triggers

```yaml
# Automatic on translation file changes
on:
  push:
    paths:
      - 'src/lib/i18n/translations/**'

# Manual trigger with options
workflow_dispatch:
  inputs:
    dry_run:
      type: boolean
    namespace:
      type: string
```

## Best Practices

1. **Always run dry-run first** to preview changes
2. **Review PRs carefully** before merging translation changes
3. **Use specific namespaces** when working on particular features
4. **Keep local files as source of truth** for new translations
5. **Use Traduora interface** for translator-driven updates