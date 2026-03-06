# Peek for YNAB

[![CI status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml)
[![Website deployment status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml)
[![Web Store submission status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml)

A browser extension for YNAB that lets users see their category and account balances at a glance, quickly add transactions, setup customizable notifications, and more. See full feature list and installation links on the [extension website](https://peek-for-ynab-v2.fly.dev).

## Project layout

- `extension/` Browser extension using WXT, React, and TypeScript
  - `src/`
    - `components/` React components
    - `entrypoints/` Extension popup page, options page, and background script
    - `lib/` Library and utility functions
    - `styles/` Extension CSS / Sass styles
  - `test/` Unit tests with Vitest
- `web/` Website and server using Astro and Fastify
  - `server/` Fastify server (serves Astro as middleware)
  - `src/`
    - `pages/` All website pages and routes (Astro)

## Building and running locally

You must have Node.js (>= 22) and pnpm installed before proceeding.

### Environment variables

Set up an OAuth application in your YNAB [Developer Settings](https://app.ynab.com/settings/developer). Then, in both the `extension/` and `web/` directories, copy the `.env.example` file to `.env` and fill in the values.

### Backend / Web

The server and website is created with [Astro](https://astro.build/). Pages and API routes are located in the `web/src/pages/` folder. You can run the server via:

```bash
cd web
pnpm install
pnpm build
pnpm start
```

### Extension

This extension is developed using the [WXT framework](https://wxt.dev/). To run the extension's development server, make sure the Astro server (see above) is running and then run:

```bash
cd extension
pnpm install
pnpm dev
```

A development browser should open automatically and load the extension.


## Building for production

### Extension

```bash
cd extension
pnpm build
```

The extension will be built to the `extension/build/chrome-mv3` folder. This can be loaded into Chrome by navigating to `chrome://extensions/` and clicking "Load unpacked".

### Backend / Web

```bash
cd web
pnpm build
```

The Astro backend and website will be built as an Express-compatible middleware to the `web/dist/` folder. You can then run the Fastify server via:

```bash
pnpm start
```
