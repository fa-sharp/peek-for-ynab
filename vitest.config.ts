import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["vitest.setup.ts", "jest-webextension-mock"],
    sequence: { setupFiles: "list" },
    environment: "jsdom"
  },
  plugins: [tsConfigPaths(), react()]
});
