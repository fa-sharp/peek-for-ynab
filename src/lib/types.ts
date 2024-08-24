import type { CurrencyFormat } from "ynab";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

export interface AppSettings {
  /** Category and account names are reduced to emojis */
  emojiMode: boolean;
  /** Balances are hidden unless you hover over them */
  privateMode: boolean;
  /** Whether access is allowed to current tab for extra features */
  currentTabAccess: boolean;
  /** The color theme for the extension. @default "auto" */
  theme?: "auto" | "dark" | "light";
  /** Whether animations are enabled. @default false */
  animations?: boolean;
}

/** Budget-specific settings */
export interface BudgetSettings {
  notifications: BudgetNotificationSettings;
  transactions: {
    /** Whether transactions are marked Cleared by default */
    cleared: boolean;
    /** Whether transactions are automatically marked Approved */
    approved: boolean;
    /** Whether to remember the last-used account for transaction entry. */
    rememberAccount: boolean;
    /** Default account for purchases */
    defaultAccountId?: string;
  };
}

/** Notification settings for a specific budget */
export interface BudgetNotificationSettings {
  /** Notify when a category is overspent */
  overspent: boolean;
  /** Check for new bank imports and notify if there are unapproved transactions  */
  checkImports: boolean;
  /** Notify when a bank connection is showing an error */
  importError: boolean;
  /** Reminders for reconciliation - stored as a map
   * of accountId to max # of days since last reconciliation */
  reconcileAlerts: {
    [accountId: string]: number | undefined;
  };
}

/** Budget data cached by the app */
export interface CachedBudget {
  id: string;
  name: string;
  currencyFormat?: CurrencyFormat;
}

/** Payee data cached by the app */
export interface CachedPayee {
  id: string;
  name: string;
  transferId?: string | null;
}

/** State of the account/category detail screen */
export interface DetailViewState {
  type: "account" | "category";
  id: string;
}

/** Initial state of the add transaction screen */
export interface TxAddInitialState {
  amount?: string;
  amountType?: "Inflow" | "Outflow";
  accountId?: string;
  categoryId?: string;
  payee?: CachedPayee;
  isTransfer?: boolean;
  returnTo?: {
    view: "main" | "detail";
    detailState?: DetailViewState;
  };
}

/** Initial state of the move money screen */
export interface MoveMoneyInitialState {
  amount?: string;
  fromCategoryId?: string;
  toCategoryId?: string;
  returnTo?: {
    view: "main" | "detail";
    detailState?: DetailViewState;
  };
}
