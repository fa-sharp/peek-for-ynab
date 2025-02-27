import { Storage } from "@plasmohq/storage";

import type { AppSettings, BudgetSettings, PopupState } from "./types";

/** Update these 2 variables to alert the user for a major new update/version */
export const LATEST_VERSION_ALERT_NUM = 4;
export const LATEST_VERSION_ALERT_TEXT = "New: Detail views!";

export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ONE_DAY_IN_MILLIS = 1000 * 60 * 60 * 24;

export const OAUTH_BASE_URL = "https://app.ynab.com/oauth/token";
export const TOKEN_STORAGE_KEY = "tokenData";
export const REFRESH_SIGNAL_KEY = "tokenRefreshing";
export const BACKGROUND_ALARM_NAME = "backgroundRefresh";

export const CHROME_LOCAL_STORAGE = new Storage({ area: "local" });
export const CHROME_SYNC_STORAGE = new Storage({ area: "sync" });
export const CHROME_SESSION_STORAGE = new Storage({ area: "session" });
export const TOKEN_STORAGE = new Storage({ area: "local" });

export const DEFAULT_POPUP_STATE: PopupState = {
  view: "main",
  budgetId:
    // try reading initial value from `localStorage` (old way of storing the selected budget)
    typeof window !== "undefined"
      ? JSON.parse(window.localStorage.selectedBudget || '""')
      : ""
};

export const DEFAULT_SETTINGS = Object.freeze<AppSettings>({
  currentTabAccess: false,
  theme: "auto",
  animations: true,
  omnibox: false
});

export const DEFAULT_BUDGET_SETTINGS = Object.freeze<BudgetSettings>({
  notifications: {
    checkImports: false,
    importError: false,
    overspent: false,
    reconcileAlerts: {}
  },
  transactions: {
    approved: true,
    cleared: false,
    rememberAccount: false
  },
  confetti: {
    allCategories: false,
    categories: [],
    emojis: []
  }
});
