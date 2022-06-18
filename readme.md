# Widget for YNAB

A Chrome extension for YNAB that lets users see their category balances at a glance.

## Building and running locally

### Extension

This extension was developed using the [Plasmo framework](https://docs.plasmo.com/). The popup component is located at `src/popup.tsx`.

You can run the extension's development server via:

```bash
pnpm dev:plasmo
# or
npm run dev:plasmo
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

For further guidance, [visit Plasmo's Documentation](https://docs.plasmo.com/)

### Website

The website is created with [Next.js](https://nextjs.org/). Pages are located in the `src/pages/` folder. You can run the development server via:

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
