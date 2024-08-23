# Peek for YNAB

A browser extension for YNAB that lets users see their category and account balances at a glance, and add transactions.

## Project layout

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


## Principles

- Functionality: The extension tries to focus solely on what might be useful when a user is on a different website and wants to quickly check on YNAB. Features like moving money, editing transactions, renaming categories, reconciling, etc. - while _technically_ possible using the YNAB API - are best done within the official apps, so we avoid implementing those things.
- Accessibility: The extension prioritizes accessibility as much as possible: semantic HTML elements, keyboard accessible buttons and forms, accessible color contrasts, etc.
- Data Privacy: The extension stores and caches a minimal amount of data. The data is either stored locally, or synced to the user's browser profile using [Chrome Storage](https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync). The Next.js API routes are solely used to retrieve OAuth tokens from YNAB (this needs to happen in a server-only context to protect the OAuth secret). All other communication with the YNAB API happens directly from the extension.
- Permissions: The extension uses a minimal amount of [browser permissions](https://developer.chrome.com/docs/extensions/reference/permissions-list) needed to do its basic functionality ([storage](https://developer.chrome.com/docs/extensions/reference/api/storage), [identity](https://developer.chrome.com/docs/extensions/reference/api/identity), and [alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)). The user must explicity enable other permissions (e.g. reading the active tab, notifications) in the extension settings.
- Dependencies: The extension is designed to be as lightweight as possible (production build <5 MB), so we try to be very conscientious about adding more external libraries. Dependencies are regularly updated.

## Building and running locally

### Environment variables

Set the following variables in a `.env` file:

- `PLASMO_PUBLIC_MAIN_URL`: The URL of the Next.js website and API routes (when running locally, set this to `http://localhost:3000`)

Set up an OAuth application in your YNAB Developer Settings, then set the following environment variables:

- `PLASMO_PUBLIC_YNAB_CLIENT_ID`: OAuth client ID
- `NEXT_PUBLIC_YNAB_CLIENT_ID`: OAuth client ID
- `YNAB_SECRET`: OAuth secret (server-only variable, won't be exposed to the extension)

### Extension

Run ```pnpm install``` or ```npm install``` to install all dependencies.

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
