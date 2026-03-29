import type { AppSettings, BudgetSettings, PopupState } from "./types";

/** Update these 2 variables to alert the user for a major new update/version */
export const LATEST_VERSION_ALERT_NUM = 5;
export const LATEST_VERSION_ALERT_TEXT = "New: Approve transactions!";

export const IS_DEV = import.meta.env.DEV && !import.meta.env.VITEST;
export const IS_PRODUCTION = import.meta.env.PROD;

/** Storage keys for persisted state items */
export const STORAGE_KEYS = Object.freeze({
  AppSettings: "settings",
  AccessToken: "accessToken",
  AuthToken: "authToken",
  BudgetSettings: (budgetId: string) => `budget-${budgetId}`,
  CurrentAlerts: "currentAlerts",
  PinnedItems: (budgetId: string) => `budget-${budgetId}:pinned`,
  PopupState: "popupState",
  SavedPayees: (budgetId: string) => `budget-${budgetId}:payees`,
  ShouldSyncSettings: "sync",
  TxState: "txState",
  /** @deprecated TODO remove after auth migration */
  OldToken: "tokenData",
  VersionAlert: "versionAlert",
});

export const ONE_DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
export const ONE_MINUTE_IN_MILLIS = 1000 * 60;

/** Use a delta request for categories, accounts, and payees if cached data is fresher than this (8 hours in millis) */
export const DELTA_REQUEST_TIME = 8 * 60 * 60 * 1000;

export const BACKGROUND_ALARM_NAME = "backgroundRefresh";

export const DEFAULT_POPUP_STATE: PopupState = {
  view: "main",
  budgetId: "",
};

export const DEFAULT_SETTINGS = Object.freeze<AppSettings>({
  currentTabAccess: false,
  theme: "auto",
  animations: true,
  omnibox: false,
});

export const DEFAULT_BUDGET_SETTINGS = Object.freeze<BudgetSettings>({
  notifications: {
    checkImports: false,
    importError: false,
    overspent: false,
    reconcileAlerts: {},
  },
  transactions: {
    approved: true,
    cleared: false,
    rememberAccount: false,
  },
  confetti: {
    allCategories: false,
    categories: [],
    emojis: [],
  },
});
