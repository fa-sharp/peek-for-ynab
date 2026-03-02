import { resolve } from "node:path";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  publicDir: resolve("src/public"),
  imports: false, // disable auto-imports
  targetBrowsers: ["chrome", "firefox"],
  vite: () => ({
    envPrefix: "PUBLIC_"
  }),
  manifest: {
    name: "Peek for YNAB",
    homepage_url: "https://peekforynab.com",
    permissions: ["identity", "alarms", "storage"],
    optional_permissions: ["scripting", "activeTab", "notifications"],
    host_permissions: ["https://api.ynab.com/*"],
    omnibox: {
      keyword: "peek"
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Alt+Shift+Y"
        },
        description: "Open the extension popup"
      }
    },
    browser_specific_settings: {
      gecko: {
        id: "{e734411e-6aae-4590-ab10-65e7a226b311}",
        strict_min_version: "109.0"
      }
    }
  },
  alias: {
    "~components": "src/components",
    "~lib": "src/lib"
  },
  autoIcons: { baseIconPath: "assets/icon512.png" },
  webExt: {
    chromiumArgs: [`--user-data-dir=${resolve(".wxt/chrome-data")}`],
    keepProfileChanges: true
  },
  modules: ["@wxt-dev/auto-icons", "@wxt-dev/module-react"]
});
