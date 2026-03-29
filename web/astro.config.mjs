// @ts-check

import mdx from "@astrojs/mdx";
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
  security: {
    csp: {
      styleDirective: { resources: ["'self'", "https://fonts.googleapis.com"] },
      directives: ["font-src 'self' https://fonts.gstatic.com"],
    },
  },
});
