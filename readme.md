# Peek for YNAB

[![CI status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml)
[![Website deployment status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml)
[![Web Store submission status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml)

A browser extension for YNAB that lets users see their category and account balances at a glance, quickly add transactions, setup customizable notifications, and more. See full feature list and installation links on the [extension website](https://peekforynab.com).

## Project layout

- `assets/` Extension assets
- `public/` Website images and shared scripts
- `src/`
  - `popup.tsx` Extension popup page
  - `options.tsx` Extension options page
  - `background.ts` Extension background worker (refreshes data and the OAuth token)
  - `middleware.ts` Website middleware (Next.js)
  - `app/` Website pages and routes (Next.js)
    - `api/` API routes to fetch OAuth tokens from YNAB API
  - `components/`
    - `extension/` Extension components
    - `icons/` Common icons
    - `react-aria/` [React Aria](https://react-spectrum.adobe.com/react-aria/index.html) abstract components
    - `website/` Website components
  - `lib/` Library and utility functions
    - `context/` [React Context](https://react.dev/learn/passing-data-deeply-with-context) that handles auth, data fetching, and storage for the extension
  - `styles/` CSS files
  - `tabs/` Additional extension pages
- `test/` Unit tests

## Building and running locally

### Environment variables

Set up an OAuth application in your YNAB [Developer Settings](https://app.ynab.com/settings/developer), then set the following environment variables in a `.env` file :

- `PLASMO_PUBLIC_MAIN_URL`: The URL of the Next.js website and API routes (when running locally, set this to `http://localhost:3000`)
- `PLASMO_PUBLIC_YNAB_CLIENT_ID`: OAuth client ID
- `YNAB_SECRET`: OAuth secret (server-only variable, won't be exposed to the extension)

### Extension

Run `pnpm install` to install all dependencies.

This extension was developed using the [Plasmo framework](https://docs.plasmo.com/). You can run the extension's development server via:

```bash
pnpm dev:plasmo
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

For further guidance, [visit Plasmo's Documentation](https://docs.plasmo.com/)

### Website

The website is created with [Next.js](https://nextjs.org/). Pages and API routes are located in the `src/app/` folder. You can run the development server via:

```bash
pnpm dev:next
```

## Making production build

Extension:

```bash
pnpm build:plasmo
```

Website:

```bash
pnpm build:next
```
