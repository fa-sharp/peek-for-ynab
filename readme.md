# Peek for YNAB

A browser extension for YNAB that lets users see their category and account balances at a glance, and add transactions.

### Project layout

- `src/`
  - `popup.tsx` Extension - popup component
  - `options.tsx` Extension - options component
  - `background.ts` Extension - background worker (refreshes the token)
  - `pages/` Website and server (Next.js)
    - `api/` API routes to fetch OAuth tokens from YNAB API
  - `lib/` Library and utility functions
    - `context/` React Context that provides auth, API data, and storage to the extension
  - `components/` View components
  - `styles/` CSS files

## Building and running locally

### Environment variables

Set the following variables in a `.env` file:

- `PLASMO_PUBLIC_MAIN_URL`: The URL of the Next.js website and API routes (when running locally, set this to `http://localhost:3000`)

Set up an OAuth application in your YNAB Developer Settings, then set the following environment variables:

- `PLASMO_PUBLIC_YNAB_CLIENT_ID`: OAuth client ID
- `NEXT_PUBLIC_YNAB_CLIENT_ID`: OAuth client ID
- `YNAB_SECRET`: OAuth secret (server only)

### Extension

This extension was developed using the [Plasmo framework](https://docs.plasmo.com/). You can run the extension's development server via:

```bash
pnpm dev:plasmo
# or
npm run dev:plasmo
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

For further guidance, [visit Plasmo's Documentation](https://docs.plasmo.com/)

### Website

The website is created with [Next.js](https://nextjs.org/). Pages and API routes are located in the `src/pages/` folder. You can run the development server via:

```bash
pnpm dev:next
# or
npm run dev:next
```

## Making production build

Extension:

```bash
pnpm build:plasmo
# or
npm run build:plasmo
```

Website:

```bash
pnpm build:next
# or
npm run build:next
```
