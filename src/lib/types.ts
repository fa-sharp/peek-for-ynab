import type {
  Account,
  Category,
  CategoryGroupWithCategories,
  CurrencyFormat
} from "ynab";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

/** Current popup state */
export interface PopupState {
  /** Current page/view */
  view: "main" | "txAdd";
  /** Currently selected budget ID. Could be an empty string if no budget is selected. */
  budgetId: string;
}

export interface AppSettings {
  /** Whether access is allowed to current tab for extra features */
  currentTabAccess: boolean;
  /** The color theme for the extension. @default "auto" */
  theme?: "auto" | "dark" | "light";
  /** Whether animations are enabled. @default true */
  animations?: boolean;
  /** Whether omnibox is enabled. @default false */
  omnibox?: boolean;
}

/** Budget-specific settings */
export interface BudgetSettings {
  notifications: BudgetNotificationSettings;
  transactions: {
    /** Whether transactions are marked Cleared by default @default false */
    cleared: boolean;
    /** Whether transactions are automatically marked Approved @default true */
    approved: boolean;
    /** Whether to remember the last-used account for transaction entry. @default false */
    rememberAccount: boolean;
    /** Default account for purchases */
    defaultAccountId?: string;
  };
  confetti?: BudgetConfettiSettings;
}

/** Notification settings for a specific budget */
export interface BudgetNotificationSettings {
  /** Notify when a category is overspent @default false  */
  overspent: boolean;
  /** Check for new bank imports and notify if there are unapproved transactions @default false   */
  checkImports: boolean;
  /** Notify when a bank connection is showing an error @default false  */
  importError: boolean;
  /** Reminders for reconciliation - stored as a map
   * of accountId to max # of days since last reconciliation @default {} // no reminders  */
  reconcileAlerts: {
    [accountId: string]: number | undefined;
  };
}

export interface BudgetConfettiSettings {
  allCategories: boolean;
  categories: string[];
  emojis: string[];
}

/** Payees, category groups, categories, and accounts */
export interface BudgetMainData {
  accountsData: Account[];
  categoriesData: Category[];
  categoryGroupsData: CategoryGroupWithCategories[];
  payeesData: CachedPayee[];
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

/** Initial state of the add transaction screen */
export interface TxAddInitialState {
  amount?: string;
  amountType?: "Inflow" | "Outflow";
  accountId?: string;
  categoryId?: string;
  payee?: CachedPayee | { name: string } | null;
  isTransfer?: boolean;
  memo?: string;
  isSplit?: boolean;
  subTxs?: Array<SubTxState>;
}

/** Split transaction state  */
export interface SubTxState {
  amount: string;
  amountType: "Inflow" | "Outflow";
  payee?: CachedPayee | { name: string } | null;
  isTransfer: boolean;
  categoryId?: string;
  memo?: string;
}
