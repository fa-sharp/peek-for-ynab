# Peek for YNAB

An open-source browser extension for YNAB that lets users see their category and account balances at a glance, add transactions, and setup customizable notifications. See full feature list and installation links on the [extension website](https://peek-for-ynab.fly.dev).

## Project layout

- `src/`
  - `popup.tsx` Extension - popup component
  - `options.tsx` Extension - options component
  - `background.ts` Extension - background worker (refreshes the token)
  - `app/` Website and server (Next.js)
    - `api/` API routes to fetch OAuth tokens from YNAB API
  - `lib/` Library and utility functions
    - `context/` [React Context](https://react.dev/learn/passing-data-deeply-with-context) that handles auth, data fetching, and storage for the extension
  - `components/` View components
  - `styles/` CSS files

## Principles

These are some principles that guide the Peek for YNAB project. Please take a moment to read before submitting an issue or pull request.

- Functionality: The extension tries to focus on features that might be useful when a user is on a different website and wants to quickly check on YNAB and/or add a transaction. While the YNAB API enables a lot of possible features - e.g. approving and categorizing transactions, renaming categories, reconciling, etc. - they are not reasonably needed in this context, as the user can just open the YNAB web app.
- Accessibility: The extension prioritizes accessibility as much as possible: semantic HTML elements, keyboard accessible buttons and forms, proper aria roles and attributes, accessible color contrasts, etc.
- Data Privacy: The extension stores and caches a minimal amount of data. The data is either stored locally in the browser, or (if the user chooses) synced to the user's browser profile using the [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync). The Next.js API routes are solely used to retrieve OAuth tokens from YNAB (this needs to happen in a server-only context to protect the OAuth secret). All other communication with the YNAB API happens directly from the extension.
- Permissions: The extension only uses the minimum amount of [browser permissions](https://developer.chrome.com/docs/extensions/reference/permissions-list) needed to do its basic functionality ([storage](https://developer.chrome.com/docs/extensions/reference/api/storage), [identity](https://developer.chrome.com/docs/extensions/reference/api/identity), and [alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)). If the user chooses, they can enable other permissions (e.g. reading the [active tab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), enabling [system notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications)) in the extension settings.
- API usage: YNAB has generously made their public API free to use, and we aim to be respectful of that privilege. The extension tries to stay well under their [rate limit](https://api.ynab.com/#rate-limiting), by implementing some caching and limiting background requests to every 15 minutes.
- Dependencies: The extension is designed to be very lightweight (production build <5 MB), so we avoid adding more external libraries/dependencies. We lean into native browser APIs as much as possible.

## Building and running locally

### Environment variables

Set up an OAuth application in your YNAB [Developer Settings](https://app.ynab.com/settings/developer), then set the following environment variables in a `.env` file :

- `PLASMO_PUBLIC_MAIN_URL`: The URL of the Next.js website and API routes (when running locally, set this to `http://localhost:3000`)
- `PLASMO_PUBLIC_YNAB_CLIENT_ID`: OAuth client ID
- `YNAB_SECRET`: OAuth secret (server-only variable, won't be exposed to the extension)

### Extension

Run `pnpm install` or `npm install` to install all dependencies.

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
