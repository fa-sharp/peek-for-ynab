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
});
