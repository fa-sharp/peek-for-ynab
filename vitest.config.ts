import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {},
  plugins: [tsConfigPaths(), react()]
});
