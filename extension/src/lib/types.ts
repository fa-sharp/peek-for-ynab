import type {
  Account,
  Category,
  CategoryGroupWithCategories,
  CurrencyFormat,
} from "./api/client";

/** Current popup state */
export interface PopupState {
  /** Current page/view */
  view: "main" | "txAdd" | "detail" | "move";
  /** Currently selected budget ID. Could be an empty string if no budget is selected. */
  budgetId: string;
  detailState?: DetailViewState;
  moveMoneyState?: MoveMoneyInitialState;
}

/** Global settings */
export interface AppSettings {
  /** List of budget IDs to show */
  budgets?: string[];
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

/** Map of URL hosts to saved payee ID */
export interface SavedPayees {
  [url: string]: string | undefined;
}

/** Payees, category groups, categories, and accounts */
export interface BudgetMainData {
  accountsData: Account[];
  categoriesData: Category[];
  categoryGroupsData: CategoryGroupWithCategories[];
  payeesData: CachedPayee[];
  currencyFormat?: CurrencyFormat;
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

/** State of the add transaction form */
export interface TxAddState {
  amount?: string;
  amountType?: "Inflow" | "Outflow";
  accountId?: string | null;
  categoryId?: string | null;
  payee?: CachedPayee | { name: string } | null;
  isTransfer?: boolean;
  memo?: string;
  flag?: string;
  isSplit?: boolean;
  subTxs?: Array<SubTxState>;
  cleared?: boolean;
  date?: string;
  returnTo?:
    | { view: "main" }
    | {
        view: "detail";
        detailState: DetailViewState;
      };
  errorMessage?: string;
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

/** Initial state of the move money screen */
export interface MoveMoneyInitialState {
  amount?: string;
  fromCategoryId?: string;
  toCategoryId?: string;
  returnTo?:
    | { view: "main" }
    | {
        view: "detail";
        detailState: DetailViewState;
      };
}
