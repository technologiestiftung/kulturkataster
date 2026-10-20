<div align="center">
  <img src="src/logos/kuka-large.svg" alt="Kulturkataster Logo" width="200" />
</div>

![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

# Kulturkataster

Web Application for the Kulturkataster, a platform for mapping and managing cultural places in Berlin.

## Overview

The Kulturkataster is a Next.js application with an interactive map and a list view of Berlin's cultural places. Registered users maintain place data in an account area, and guests can suggest new places.

There is no separate backend: Next.js serves the UI, server actions and API routes, and Supabase provides the Postgres database, authentication and file storage.

**Key Features:**

- Interactive map and an accessible list view with search and filters
- German and English, with translations managed in Traduora
- Account area to edit places, categories, tags, groups, users and roles (role-based access)
- Suggestions and updates from guests, reviewed before they go live
- CSV/XLSX export and import of places
- Questionnaire for the Kulturort-Index
- Responsive design, built to WCAG 2.1 AA (see [Accessibility](#accessibility))

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 with a custom design system
- **UI Components**: Radix UI primitives
- **Mapping**: OpenLayers with MapTiler
- **State Management**: Zustand
- **Internationalization**: i18next with next-i18n-router, synced with Traduora
- **Database and Auth**: Supabase (Postgres, Auth, Storage) with Prisma
- **Testing**: Vitest (unit and integration), Playwright (e2e)
- **Deployment**: Docker images built with GitHub Actions

## Prerequisites

- Node.js 24 (the version used in CI and the Docker image)
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker, for a local database
- A MapTiler API key for the map

## Installation

### Local Development Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/technologiestiftung/kulturkataster
   cd kulturkataster
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   Copy the example file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   `.env.example` lists every variable with a short comment. See [Environment Variables](#environment-variables) for what is required.

4. **Database**

   Start a local Supabase (uses `supabase/config.toml`), then apply the schema and data migrations:

   ```bash
   supabase start
   npm run prisma:generate
   npx prisma migrate deploy
   npm run data:migrate
   ```

   See [`prisma/README.md`](prisma/README.md) and [`data-migrations/README.md`](data-migrations/README.md) for details.

## Running the Project

To start a local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Other Development Commands

```bash
npm run build             # Build for production
npm run start             # Start production server
npm run lint              # Run ESLint
npm run format            # Check formatting with Prettier
npm run format:fix        # Fix formatting
npm test                  # Unit and integration tests (e2e runs in GitHub CI)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests, need a database configured in .env.test
npm run test:e2e          # Playwright e2e, only when needed locally
```

Copy `.env.test.example` to `.env.test` for the integration and e2e tests. To seed a local database with synthetic test data, see [E2E Seed](scripts/README.md#e2e-seed).

## Docker

### Building the Docker Image

```bash
docker build -t kulturkataster .
```

### Running with Docker

The server reads its configuration at runtime, so pass your `.env` file:

```bash
docker run -p 3000:3000 --env-file .env kulturkataster
```

## CI/CD and Deployment

### Continuous Integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`, `dev` and `release/v*`:

- **test**: format check, lint, unit and integration tests
- **build**: production build
- **e2e**: starts a throwaway local Supabase (`supabase/config.toml`), applies migrations, seeds synthetic data, then runs the integration and Playwright suites

### Releases

1. **Create Release Branch** (`release-create.yml`, started manually from `main` or `dev`) bumps the version (patch, minor or major), creates a `release/v*` branch and a GitHub release.
2. **Deploy App (Release)** (`deploy-release.yml`) runs on pushes to `release/v*`. It builds the Docker image and publishes it to the GitHub Container Registry (`ghcr.io/technologiestiftung/kulturkataster`, tagged with the version), backs up the database, applies the Prisma schema migrations and deploys. Release branches from `dev` deploy to the dev environment, the others to production.

Data migrations (`npm run data:migrate`) are not part of the release workflow yet and are applied separately after a deployment.

Environment-specific configuration is managed through the GitHub environments `main` and `dev`.

## Internationalization (i18n)

The project uses `i18next` with URL-based locales (`/de/…`, `/en/…`). German is the primary language, English the secondary one.

### Translation Structure

Each locale has one file:

```
src/lib/i18n/translations/
├── de/translation.json
└── en/translation.json
```

Each file is grouped into `common` (general UI labels), `content` (page and modal content) and `enumMap` (field labels, options, categories). The app uses the single namespace `translation`, so keys include the group:

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
	const { t } = useTranslation();
	return <h1>{t("common.auth.login")}</h1>;
}
```

Add every user-visible text to both files.

### Traduora Sync

Translations are maintained in [Traduora](https://traduora.co/). A GitHub workflow (`sync-traduora.yml`) pulls them every night and opens a pull request with the changes. See [`scripts/README.md`](scripts/README.md) for details.

```bash
npm run traduora:push  # Upload local translations to Traduora
npm run traduora:pull  # Download translations from Traduora
```

## Architecture

### Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── [locale]/          # Localized routes, with parallel routes for modals and the sidebar
│   └── api/               # API routes (e.g. import)
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── Map/               # Map components
│   ├── Filter/            # Filters
│   └── ...
├── server/                # Server-only code
│   ├── actions/           # Server actions
│   ├── data/              # Database access (Prisma repositories)
│   ├── logic/             # Business logic, e.g. import and submissions
│   └── validation/        # Input validation (Zod)
├── lib/                   # Shared utilities, hooks, stores and translations
├── generated/             # Generated Prisma client
├── types/                 # TypeScript types
└── logos/                 # Logos
```

### State Management

Client state lives in Zustand stores in `src/lib/store/`, for example:

- **App and map state**: UI preferences, map interactions and layers
- **Institutions**: cultural places and filters
- **Account**: data for the account area
- **Drafts**: suggestions for places and questionnaire answers in progress

## Development

### Code Standards

- **TypeScript**: strict mode
- **ESLint**: Next.js configuration with custom rules, including `eslint-plugin-jsx-a11y`
- **Prettier**: formatting
- **Husky**: pre-commit (format, lint, tests) and commit-msg (Conventional Commits) hooks

### Adding New Features

1. Write an issue so we can discuss the change
2. Create a feature branch from `dev`
3. Add translations for new text in German and English
4. Test locally (`npm run lint`, `npm test`)
5. Create a pull request to `dev`

### Environment Variables

All variables are listed in `.env.example`. They are read on the server at runtime.

**Required:**

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `MAPTILER_API_KEY`, `MAP_BOUNDING_BOX`
- `SITE_URL`

**Optional:**

- `TRADUORA_*`: load translations from Traduora at runtime; without them the bundled files are used
- `FILE_STORAGE_BUCKET`, `SUPABASE_CATEGORY_ICONS_BUCKET`: storage buckets
- `EMAIL_PROVIDER` and `SMTP_*`: transactional emails (`noop` sends nothing)
- `CLEVERREACH_*`: newsletter sign-up
- `OTEL_*`: telemetry export
- `CAP_URL`, `CAP_SITE_KEY`, `CAP_SECRET_KEY`: Cap captcha for guest submissions, off when unset
- `HIDDEN_MENU_ITEMS`, `ACCOUNT_AUTO_REFRESH_INTERVAL_MS`: UI settings

## Accessibility

The Kulturkataster is a public-sector service. We build to **WCAG 2.1 level AA**, the
standard that BITV 2.0 references via EN 301 549, and treat it as the minimum. The legal
obligations for the project (including the accessibility statement) are confirmed with
the responsible person at the Technologiestiftung Berlin.

**Built in for users:**

- Accessibility settings (`/accessibilitySettings`): dark mode, larger fonts, reduced
  animations (the OS setting `prefers-reduced-motion` is respected as well)
- Information in German Sign Language (`/signLanguage`) and Leichte Sprache (`/simpleLanguage`)
- A list view (`/list`) with search and filters as the non-map alternative to the map
- Skip link to the main content, keyboard-operable navigation, dialogs and filters

**When building UI:**

- Use the native element: links navigate (`<Link>`), buttons act (`<button>`). No
  clickable `div`s; for clickable cards use a full-size button behind the content
  (see `InstitutionCard`) instead of `role="button"` on the card.
- Every control has an accessible name: icon-only buttons need an `aria-label`
  (`ButtonWithTooltip` uses the tooltip text by default), inputs need a label.
- Keep the visible focus ring (`focus-visible:ring-2` / `.tab-ring`); never only
  `outline-none`.
- Link form errors to their field with `aria-describedby`, mark required fields with
  `aria-required`, and give radio and checkbox groups a group label.
- Announce dynamic changes (result counts, empty states) through a `role="status"` region.
- Never convey meaning by colour alone; text needs 4.5:1 contrast, UI borders 3:1.
- Put all user-visible and screen-reader texts in the translation files; accessibility
  strings live under `common.a11y.*`.
- Wrap non-essential animation in `motion-safe:` and use `getAccessibleScrollBehavior()`
  for scrolling.

**Testing:**

- `npm run lint` includes `eslint-plugin-jsx-a11y`; treat its warnings as bugs.
- For every UI change, complete the flow with the keyboard only (`Tab`, `Enter`, `Space`,
  arrow keys, `Escape`) and check it at 200% zoom and 320px width.
- Test significant features with a screen reader (VoiceOver on macOS, NVDA on Windows).
  Automated checks find only part of the issues.

## Contributing

Before you create a pull request, write an issue so we can discuss your changes.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/LuiseBrandenburger"><img src="https://avatars.githubusercontent.com/u/61413319?v=4?s=64" width="64px;" alt="Luise Brandenburger"/><br /><sub><b>Luise Brandenburger</b></sub></a><br /><a href="https://github.com/technologiestiftung/kulturkataster/commits?author=LuiseBrandenburger" title="Code">💻</a> <a href="#design-LuiseBrandenburger" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JonathanHaudenschild"><img src="https://avatars.githubusercontent.com/u/15103380?v=4?s=64" width="64px;" alt="Jonathan Haudenschild"/><br /><sub><b>Jonathan Haudenschild</b></sub></a><br /><a href="https://github.com/technologiestiftung/kulturkataster/commits?author=JonathanHaudenschild" title="Code">💻</a> <a href="#infra-JonathanHaudenschild" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/technologiestiftung/kulturkataster/commits?author=JonathanHaudenschild" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

The source code is licensed under the [GNU General Public License v3.0](LICENSE).

## Content Licensing

Texts and content available as [CC BY](https://creativecommons.org/licenses/by/3.0/de/).

## Credits

© 2025 - Ein Projekt der Kulturraum Berlin gGmbH, gefördert durch die Senatsverwaltung für Kultur und Gesellschaftlichen Zusammenhalt, mit der technischen Umsetzung durch die Technologiestiftung Berlin.

<table>
  <tr>
    <td align="center">
      <strong>Projekt von</strong><br />
      <a href="https://kulturraum.berlin/">
        <img width="120" src="src/logos/KRB.svg" alt="Kulturraum Berlin" />
      </a>
    </td>
    <td align="center">
      <strong>Gefördert durch</strong><br />
      <a href="https://www.berlin.de/sen/kultgz/">
        <img width="120" src="src/logos/senate.svg" alt="Senatsverwaltung für Kultur und Gesellschaftlichen Zusammenhalt" />
      </a>
    </td>
    <td align="center">
      <strong>Technische Umsetzung</strong><br />
      <a href="https://www.technologiestiftung-berlin.de/">
        <img width="120" src="src/logos/technologiestiftung.svg" alt="Technologiestiftung Berlin" />
      </a>
    </td>
  </tr>
</table>
