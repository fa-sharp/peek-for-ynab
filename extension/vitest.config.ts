import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  test: {
    setupFiles: ["vitest.setup.ts"],
    environment: "happy-dom",
  },
  plugins: [WxtVitest()],
});
