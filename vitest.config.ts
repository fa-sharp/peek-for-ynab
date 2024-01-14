/// <reference types="vitest" />
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {},
  plugins: [tsConfigPaths()]
});
