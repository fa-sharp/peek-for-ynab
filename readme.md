# Peek for YNAB

[![CI status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml)
[![Website deployment status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml)
[![Web Store submission status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml)

An open-source browser extension for YNAB that lets users see their category and account balances at a glance, add transactions, and setup customizable notifications. See full feature list and installation links on the [extension website](https://peekforynab.com).

## Project layout

- `src/`
  - `popup.tsx` Extension - popup component
  - `options.tsx` Extension - options component
  - `background.ts` Extension - background worker (refreshes data and the OAuth token)
  - `app/` Website and server (Next.js)
    - `api/` API routes to fetch OAuth tokens from YNAB API
  - `lib/` Library and utility functions
    - `context/` [React Context](https://react.dev/learn/passing-data-deeply-with-context) that handles auth, data fetching, and storage for the extension
  - `components/` View components
  - `styles/` CSS files

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

## Principles

These are some principles that guide the Peek for YNAB project. Please take a moment to read before submitting an issue or pull request.

- Functionality: The extension tries to focus on features that might be useful when a user is on a different website and wants to quickly check on YNAB and/or add a transaction. While the YNAB API enables a lot of other possible features - e.g. approving and categorizing transactions, renaming categories, reconciling, etc. - they are not reasonably needed in this context, as the user can just open the YNAB web app.
- Accessibility: The extension prioritizes accessibility as much as possible: semantic HTML elements, keyboard accessible buttons and forms, proper aria roles and attributes, accessible color contrasts, etc.
- Data Privacy: The extension communicates directly with the YNAB API server (api.ynab.com) to retrieve the user's budget data. The Next.js API routes are solely used to retrieve OAuth tokens from YNAB (this needs to happen in a server-only context to protect the OAuth secret). The extension caches some data locally, in order to use YNAB's [delta requests](https://api.ynab.com/#deltas) for fast and efficient data fetching. This cached data is stored using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). The user's settings are either stored locally or (if the user chooses) synced to the user's browser profile using the [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync).
- Permissions: The extension only uses the minimum amount of [browser permissions](https://developer.chrome.com/docs/extensions/reference/permissions-list) needed to do its basic functionality ([storage](https://developer.chrome.com/docs/extensions/reference/api/storage), [identity](https://developer.chrome.com/docs/extensions/reference/api/identity), and [alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)). If the user chooses, they can enable other permissions (e.g. reading the [active tab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), enabling [system notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications)) in the extension settings.
- API usage: YNAB has generously made their public API free to use, and we aim to be respectful of that privilege. The extension tries to stay well under their [rate limit](https://api.ynab.com/#rate-limiting), by implementing some caching and limiting background requests to every 15 minutes.
- Dependencies: The extension is designed to be very lightweight (production zipped build <1 MB), so we carefully consider adding any external dependencies that will increase the extension's bundle size. We prioritize using native browser APIs where possible. When external packages are necessary, we prefer small, well-maintained libraries that perform specific tasks (e.g. React Aria's abstract components).
