import { type AppSettings, type BudgetSettings } from "./context/storageContext";

export const TOKEN_STORAGE_KEY = "tokenData";
export const REFRESH_NEEDED_KEY = "tokenRefreshing";

export const DEFAULT_SETTINGS = Object.freeze<AppSettings>({
  privateMode: false,
  emojiMode: false,
  currentTabAccess: false,
  theme: "auto",
  animations: false
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
