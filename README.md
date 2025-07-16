![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

# Kulturkataster

Welcome to the **Kulturkataster** repository! This project is built using Next.js, Supabase and Maplibre. It is designed to visualize and manage cultural data in Berlin.

Below are setup instructions for running the project locally and steps for deploying it to Netlify.

---

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18 or higher)
- **npm** (usually included with Node.js)

---

### Installation

1. **Clone the Repository**

   `bash git clone <your-repo-url> && cd <your-repo-name> `

2. **Install Dependencies**

   Run the following command to install all necessary packages and add the .env:

   ```bash
   npm npm install
   ```

Then update the content of the env files accordingly

## Running the Project

To start a local development server, use the following command:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

This will start the development server, usually accessible at `http://localhost:9000` (check the terminal output to confirm).

## Internationalization (i18n)

This project leverages `i18next` for internationalization and localization support, enabling seamless language detection, switching, and modular translation management.

### Features

- **Language Detection and Switching**: Automatically detects and switches between supported languages.
- **Modular Translation Files**: Translations are organized into namespaces for better maintainability.
- **Collaborative Translation Management**: Translations are managed via the i18next web editor at [i18next Web Editor](https://translate.i18next.com/).

### Namespaces

Translations are grouped into namespaces, each representing a specific feature or area of the application. This allows for lazy-loading and better organization.

- `common`: General UI labels (e.g., buttons, messages).

Each namespace corresponds to files like:

```
/locales/en/common.json
/locales/de/auth.json
```

### Supported Languages

- **English (en)**
- **German (de)**

Languages can be switched at runtime, and new ones can be added by creating JSON files under `locales/[lang]/[namespace].json`.

### Working with Translations

1. Open the [i18next Web Editor](https://translate.i18next.com/).
2. Select your project and namespace (e.g., `dashboard`).
3. Add or edit translations for supported languages.
4. Download the updated JSON files and place them in `locales/[lang]/[namespace].json`.

The application will automatically pick up changes on load or via reload.

## Building for Production

To build the project for production, run:

```bash
npm run build
```

## Deploying to Netlify

### Steps to Deploy

1. **Login to Netlify**: Go to [Netlify](https://www.netlify.com/) and log in to your account (or create one if you haven’t already).

2. **Create a New Site**:

   - Click **"New site from Git"** and connect your GitHub (or other Git provider) account.
   - Select the repository for **Project Name**.

3. **Configure Build Settings**:

   - **Build Command**: `npm run build`
   - **Publish Directory**: ``

4. **Deploy**:
   - Click **"Deploy Site"**. Netlify will automatically build and deploy your project.

### Netlify Continuous Deployment

After the initial setup, every push to the main branch will automatically trigger a redeployment on Netlify, ensuring your site stays up-to-date.

## Tests

tbd...

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
      <td align="center" valign="top" width="14.28%"><a href="https:/github.com/LuiseBrandenburger"><img src="https://avatars.githubusercontent.com/u/61413319?s=?s=64" width="64px;" alt="Luise Brandenburger"/><br /><sub><b>Luise Brandenburger</b></sub></a><br /><a href="https://github.com/technologiestiftung/kulturkataster/commits?author=LuiseBrandenburger" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Content Licensing

Texts and content available as [CC BY](https://creativecommons.org/licenses/by/3.0/de/).

Illustrations by {tba}, all rights reserved.

## Credits

<table>
  <tr>
    <td>
      Made by  <a href="https://www.technologiestiftung-berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-de.svg" />
      </a>
    </td>
    <td>
      Supported by <a href="https://www.berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-berlin.svg" />
      </a>
    </td>
  </tr>
</table>
