// @ts-check

import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
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
  adapter: node({
    // Use standalone mode for Vercel preview deployments, middleware by default
    mode: process?.env.BUILD_MODE === "standalone" ? "standalone" : "middleware",
  }),
});
