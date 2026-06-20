# Peek for YNAB

[![CI status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/ci.yml)
[![Website deployment status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/website.yml)
[![Web Store submission status](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml/badge.svg)](https://github.com/fa-sharp/peek-for-ynab/actions/workflows/submit.yml)
[![Chrome Web Store rating](https://img.shields.io/chrome-web-store/stars/oakibhlecegcmjcjppmjkiaeedoljbmk?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/peek-for-ynab/oakibhlecegcmjcjppmjkiaeedoljbmk)

A browser extension for YNAB that lets users see their category and account balances at a glance, quickly add transactions, setup customizable notifications, and more. See full feature list and installation links on the [extension website](https://peekforynab.com).

## Project layout

- `extension/` Browser extension using WXT, React, and TypeScript
  - `src/`
    - `components/` React components
    - `entrypoints/` Extension popup page, options page, and background script
    - `lib/` Library and utility functions
    - `styles/` Extension CSS / Sass styles
  - `test/` Unit tests with Vitest
- `server/` Backend server using Rust and Axum
- `web/` Static website using Astro
  - `src/`
    - `pages/` All website pages (Astro)

## Building and running locally

You must have Rust (>= 1.96), Node.js (>= 22), and pnpm installed before proceeding.

### Environment variables

Set up an OAuth application in your YNAB [Developer Settings](https://app.ynab.com/settings/developer). Then, in both the `extension/` and `server/` directories, copy the `.env.example` file to `.env` and fill in the values.

### Web

The static website is built with [Astro](https://astro.build/).

```bash
cd web
pnpm install
pnpm build
```

### Server
The backend server uses Rust and [axum](https://docs.rs/axum).

```bash
cd server
cargo run
```

### Extension

This extension is developed using the [WXT framework](https://wxt.dev/). To run the extension's development server, make sure the server (see above) is running and then run:

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

### Server / Web

```bash
cd web
pnpm build
```

The Astro website will be built into a static site in the `web/dist/` folder. You can then build the backend server via:

```bash
cd server
cargo build --release
```
