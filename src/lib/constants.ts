import type { AppSettings, BudgetSettings } from "./types";

/** Update these 2 variables to alert the user for a major new update/version */
export const LATEST_VERSION_ALERT_NUM = 2;
export const LATEST_VERSION_ALERT_TEXT = "New feature: Notifications!";

export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ONE_DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
export const TWO_WEEKS_IN_MILLIS = ONE_DAY_IN_MILLIS * 7 * 2;

export const OAUTH_BASE_URL = "https://app.ynab.com/oauth/token";
export const TOKEN_STORAGE_KEY = "tokenData";
export const REFRESH_NEEDED_KEY = "tokenRefreshing";

export const DEFAULT_SETTINGS = Object.freeze<AppSettings>({
  privateMode: false,
  emojiMode: false,
  currentTabAccess: false,
  theme: "auto",
  animations: true
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
  }
});
