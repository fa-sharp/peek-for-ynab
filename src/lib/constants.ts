import {
  type AppSettings,
  type BudgetSettings,
  type PopupState
} from "./context/storageContext";

/** Update these 2 variables to alert the user for a major new update/version */
export const LATEST_VERSION_ALERT_NUM = 2;
export const LATEST_VERSION_ALERT_TEXT = "New feature: Notifications!";

export const OAUTH_BASE_URL = "https://app.ynab.com/oauth/token";
export const TOKEN_STORAGE_KEY = "tokenData";
export const REFRESH_SIGNAL_KEY = "tokenRefreshing";

export const DEFAULT_POPUP_STATE: PopupState = {
  view: "main",
  budgetId:
    // try reading initial value from `localStorage` (old way of storing the selected budget)
    typeof window !== "undefined"
      ? JSON.parse(window.localStorage.selectedBudget || '""')
      : ""
};

export const DEFAULT_SETTINGS = Object.freeze<AppSettings>({
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
  },
  confetti: {
    allCategories: false,
    categories: [],
    emojis: []
  }
});
