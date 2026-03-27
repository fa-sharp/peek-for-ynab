// @ts-check

import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import { defineConfig, envField } from "astro/config";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), mdx()],
  env: {
    schema: {
      YNAB_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      YNAB_SECRET: envField.string({ context: "server", access: "secret" }),
      YNAB_TOKEN_URL: envField.string({
        context: "server",
        access: "public",
        default: "https://app.ynab.com/oauth/token",
      }),
    },
  },
  image: {
    responsiveStyles: true,
  },
  adapter: !process?.env.VERCEL
    ? node({
        mode: "middleware",
      })
    : vercel(),

  security: {
    csp: {
      styleDirective: { resources: ["'self'", "https://fonts.googleapis.com"] },
      directives: ["font-src 'self' https://fonts.gstatic.com"],
    },

    // Allow cross-origin requests from Chrome extensions in development
    // TODO: remove everything below after auth migration
    checkOrigin: false,
    allowedDomains:
      process.env.NODE_ENV === "development"
        ? [{ protocol: "chrome-extension" }]
        : undefined,
  },
  vite: {
    server: {
      cors: {
        //@ts-expect-error first parameter of callback has wrong type
        origin: (origin, cb) => cb(null, !!origin?.startsWith("chrome-extension://")),
      },
    },
  },
});
