// @ts-check

import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), mdx()],
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
