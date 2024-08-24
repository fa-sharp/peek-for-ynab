import { type AppSettings, type BudgetSettings } from "./context/storageContext";

/** Update these 2 variables to alert the user for a major new update/version */
export const LATEST_VERSION_ALERT_NUM = 2;
export const LATEST_VERSION_ALERT_TEXT = "Notifications!";

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
