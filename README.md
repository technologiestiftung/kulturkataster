<div align="center">
  <img src="src/logos/kuka-large.svg" alt="Kulturkataster Logo" width="200" />
</div>

![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

# Kulturkataster Frontend

Frontend application for the Kulturkataster project - a comprehensive platform for mapping and managing cultural institutions in Berlin.

## Overview

The Kulturkataster Frontend is a Next.js application that provides an interactive map interface for exploring Berlin's cultural landscape. Built with modern web technologies, it offers multilingual support, responsive design, and advanced mapping capabilities.

**Key Features:**

- Interactive map with cultural institution visualization
- Multilingual support (currently only German implemented) with i18next
- Responsive design optimized for desktop and mobile
- Advanced filtering and search functionality
- Docker deployment with GitHub Container Registry integration
- Modern tech stack: Next.js 15, React 19, TypeScript, Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15.2.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Radix UI primitives
- **Mapping**: OpenLayers (ol) with MapTiler integration
- **State Management**: Zustand
- **Internationalization**: i18next with next-i18n-router
- **Database**: Supabase integration
- **Deployment**: Docker with GitHub Actions

## Prerequisites

- Node.js >= 18
- npm or similar package manager
- Docker (for containerized deployment)

## Installation

### Local Development Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/technologiestiftung/kulturkataster-frontend
   cd kulturkataster-frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   Create a `.env` file with the required environment variables:

   ```bash
   MAP_BOUNDING_BOX=13.091992716067702,52.33488609760638,13.742786470433,52.67626223889507
   MAPTILER_API_KEY=your_maptiler_api_key

   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=postgresql://prisma:your_password@127.0.0.1:54522/postgres

   FILE_STORAGE_BUCKET=icons

   TRADUORA_API_URL=your_traduora_api_url
   TRADUORA_CLIENT_ID=your_traduora_client_id
   TRADUORA_CLIENT_SECRET=your_traduora_client_secret
   TRADUORA_PROJECT_ID=your_traduora_project_id
   ```

## Running the Project

To start a local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Other Development Commands

```bash
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:fix   # Auto-fix formatting issues
npm test             # Unit and integration tests (e2e runs in GitHub CI)
npm run test:e2e     # Playwright e2e, only when needed locally
```

## Docker Deployment

### Building the Docker Image

```bash
docker build -t kulturkataster-frontend .
```

### Running with Docker

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key \
  -e NEXT_PUBLIC_MAP_BOUNDING_BOX=13.091992716067702,52.33488609760638,13.742786470433,52.67626223889507 \
  kulturkataster-frontend
```

## CI/CD and Deployment

### Continuous Integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`, `dev` and `release/v*`:

- **test**: format check, lint, unit and integration tests
- **build**: production build
- **e2e**: starts a throwaway local Supabase (`supabase/config.toml`), applies migrations, seeds synthetic data, then runs the integration and Playwright suites

To reproduce the e2e setup locally, see [E2E Seed](scripts/README.md#e2e-seed).

### GitHub Container Registry

The project uses GitHub Actions for automated building and publishing to GitHub Container Registry (GHCR). The workflow is triggered on pushes to `main`, `dev`, and `release/*` branches.

**Docker Images Available At:**

- `ghcr.io/technologiestiftung/kulturkataster-frontend:latest`
- `ghcr.io/technologiestiftung/kulturkataster-frontend:main`
- `ghcr.io/technologiestiftung/kulturkataster-frontend:dev`
- `ghcr.io/technologiestiftung/kulturkataster-frontend:release-*`

### Deployment Workflow

1. **Code pushed to repository**
2. **GitHub Actions triggered** based on branch
3. **Docker image built** with appropriate environment variables
4. **Image published** to GitHub Container Registry
5. **Automatic release created** (for main branch pushes)

Environment-specific configurations are managed through GitHub environments (`main` and `dev`) with appropriate secrets and variables.

## Internationalization (i18n)

This project leverages `i18next` for internationalization and localization support, enabling seamless language detection, switching, and modular translation management.

### Features

- **Language Detection and Switching**: Automatically detects and switches between supported languages
- **Modular Translation Files**: Translations are organized into namespaces for better maintainability
- **URL-based Routing**: Language-specific routes (e.g., `/en/`, `/de/`)

### Supported Languages

- **German (de)** - Primary language
- **English (en)** - Secondary language

### Translation Structure

```
src/lib/i18n/translations/
├── de/
│   ├── common.json     # General UI labels
│   ├── content.json    # Content and descriptions
│   └── enumMap.json    # Category and subcategory mappings
└── en/
    └── common.json     # English translations
```

### Working with Translations

1. Add new translation keys to the appropriate JSON files
2. Use the `useTranslation` hook in components:

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
	const { t } = useTranslation("common");
	return <h1>{t("welcome")}</h1>;
}
```

### Traduora Sync

The project includes automated translation synchronization with Traduora. See [`scripts/README.md`](scripts/README.md) for details.

**Quick commands:**

```bash
npm run traduora:push  # Upload local translations to Traduora
npm run traduora:pull  # Download translations from Traduora
```

## Architecture

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── Map/               # Map-related components
│   ├── Filter/            # Filtering functionality
│   └── ...
├── lib/                   # Utility functions and configurations
│   ├── supabase/          # Database integration
│   ├── store/             # Zustand state management
│   └── i18n/              # Internationalization setup
├── types/                 # TypeScript type definitions
└── logos/                 # Project logos and assets
```

### Key Components

- **Map Component**: OpenLayers-based interactive map with custom styling
- **Filter System**: Advanced filtering with categories, districts, and search
- **Modal System**: Responsive modals for detailed information display
- **Navigation**: Multi-level navigation with mobile optimization

### State Management

The application uses Zustand for state management with separate stores for:

- **App State**: General application state and UI preferences
- **Map State**: Map interactions, layers, and geographic data
- **Institution State**: Cultural institution data and filtering
- **Modal State**: Modal visibility and content management

## Development

### Code Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Extended Next.js configuration with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for code quality

### Adding New Features

1. Create feature branch from `dev`
2. Implement changes with proper TypeScript typing
3. Add translations for new text content
4. Test locally and ensure Docker build works
5. Create pull request to `dev` branch

### Environment Variables

The application supports different environment configurations:

**Runtime Variables** (server-side only):

- `MAP_BOUNDING_BOX`
- `MAPTILER_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `FILE_STORAGE_BUCKET`
- `TRADUORA_API_URL`
- `TRADUORA_CLIENT_ID`
- `TRADUORA_CLIENT_SECRET`
- `TRADUORA_PROJECT_ID`
- `SUPABASE_SERVICE_ROLE_KEY` (if needed for server actions)
- `CAP_URL`, `CAP_SITE_KEY`, `CAP_SECRET_KEY` (optional; Cap captcha for guest submissions, off when unset)

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
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/LuiseBrandenburger"><img src="https://avatars.githubusercontent.com/u/61413319?v=4?s=64" width="64px;" alt="Luise Brandenburger"/><br /><sub><b>Luise Brandenburger</b></sub></a><br /><a href="https://github.com/technologiestiftung/kulturkataster-frontend/commits?author=LuiseBrandenburger" title="Code">💻</a> <a href="#design-LuiseBrandenburger" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JonathanHaudenschild"><img src="https://avatars.githubusercontent.com/u/15103380?v=4?s=64" width="64px;" alt="Jonathan Haudenschild"/><br /><sub><b>Jonathan Haudenschild</b></sub></a><br /><a href="https://github.com/technologiestiftung/kulturkataster-frontend/commits?author=JonathanHaudenschild" title="Code">💻</a> <a href="#infra-JonathanHaudenschild" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/technologiestiftung/kulturkataster-frontend/commits?author=JonathanHaudenschild" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

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

## Related Projects

- [Kulturkataster Backend](https://github.com/technologiestiftung/kulturkataster-backend) - Database and API backend
