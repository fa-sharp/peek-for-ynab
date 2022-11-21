# Widget for YNAB

A Chrome extension for YNAB that lets users see their category and account balances at a glance.

### Project layout

- `src/`
  - `popup.tsx` Extension - popup component
  - `options.tsx` Extension - options component
  - `pages/` Website and server (Next.js)
    - `api/` API routes to fetch OAuth tokens from YNAB API
  - `lib/` Library and utility functions
    - `context/` - React Context that provides auth, API data, and storage to the extension
  - `components/` View components

## Building and running locally

### Environment variables

- `NEXT_PUBLIC_MAIN_URL`: The URL of the Next.js website and API routes

Set up an OAuth application in your YNAB Developer Settings:

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

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/workflows#submit-your-extension) and you should be on your way for automated submission!
