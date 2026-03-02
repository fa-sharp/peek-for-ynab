// @ts-check

import node from "@astrojs/node";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [icon()],
  image: {
    responsiveStyles: true,
  },
  adapter: node({
    mode: "standalone",
  }),
});
