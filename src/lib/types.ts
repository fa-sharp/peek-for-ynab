import type { CurrencyFormat } from "ynab";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

export interface AppSettings {
  /** Whether transactions are marked Cleared by default */
  txCleared: boolean;
  /** Whether transactions are automatically marked Approved */
  txApproved: boolean;
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
}
