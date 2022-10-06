import { createProvider } from "puro";
import { useContext, useMemo } from "react";
import { flushSync } from "react-dom";
import useLocalStorage from "use-local-storage-state";
import type { CurrencyFormat } from "ynab";

import { useStorage as useExtensionStorage } from "@plasmohq/storage/hook";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

export interface AppSettings {
  /** Whether to fetch and show accounts from each budget */
  showAccounts: boolean;
  /** Category and account names are reduced to emojis */
  emojiMode: boolean;
  /** Balances are hidden unless you hover over them */
  privateMode: boolean;
}

/** Cached budget data, stored in the browser */
export interface CachedBudget {
  id: string;
  name: string;
  currencyFormat?: CurrencyFormat;
  /** whether the budget is displayed in the main view */
  show: boolean;
}

/** A category saved by the user */
export interface SavedCategory {
  categoryId: string;
  budgetId: string;
}

/** An account saved by the user */
export interface SavedAccount {
  accountId: string;
  budgetId: string;
}

const useStorageProvider = () => {
  /** The token used to authenticate the YNAB user */
  const [tokenData, setTokenData, { remove: removeToken }] =
    useExtensionStorage<TokenData | null>(
      { key: "tokenData", area: "local", isSecret: true },
      null
    );

  const [settings, setSettings] = useLocalStorage<AppSettings>("settings", {
    defaultValue: { showAccounts: false, emojiMode: false, privateMode: false }
  });

  /** Cached API data: List of all user's budgets */
  const [cachedBudgets, setCachedBudgets] = useLocalStorage<null | CachedBudget[]>(
    "cachedBudgets",
    { defaultValue: null }
  );

  /** The budget currently in view */
  const [selectedBudgetId, setSelectedBudgetId] = useLocalStorage("selectedBudgetId", {
    defaultValue: ""
  });

  /** The categories saved by the user */
  const [savedCategories, setSavedCategories] = useLocalStorage<SavedCategory[]>(
    "savedCategories",
    { defaultValue: [] }
  );

  /** The categories saved by the user */
  const [savedAccounts, setSavedAccounts] = useLocalStorage<SavedAccount[]>(
    "savedAccounts",
    { defaultValue: [] }
  );

  /** Cached API data: Data from the budget currently in view (e.g. name, currency info, etc.) */
  const selectedBudgetData = useMemo(
    () => cachedBudgets?.find((budget) => budget.id === selectedBudgetId) || null,
    [cachedBudgets, selectedBudgetId]
  );

  const changeSetting = <K extends keyof AppSettings>(
    key: K,
    newValue: AppSettings[K]
  ) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: newValue }));
  };

  const saveCategory = (categoryToSave: SavedCategory) => {
    const foundDuplicate = savedCategories.find(
      (c) => c.categoryId === categoryToSave.categoryId
    );
    if (!foundDuplicate) setSavedCategories([...savedCategories, categoryToSave]);
  };
  const removeCategory = (categoryIdToRemove: string) => {
    setSavedCategories(
      savedCategories.filter(
        (savedCategory) => savedCategory.categoryId !== categoryIdToRemove
      )
    );
  };
  const saveAccount = (accountToSave: SavedAccount) => {
    const foundDuplicate = savedAccounts.find(
      (a) => a.accountId === accountToSave.accountId
    );
    if (!foundDuplicate) setSavedAccounts([...savedAccounts, accountToSave]);
  };
  const removeAccount = (accountIdToRemove: string) => {
    setSavedAccounts(savedAccounts.filter((a) => a.accountId !== accountIdToRemove));
  };

  /** Toggle whether a budget is shown or not. */
  const toggleShowBudget = (budgetId: string) => {
    if (!cachedBudgets) return;
    const budgetIndex = cachedBudgets.findIndex((budget) => budget.id === budgetId);
    const budgetToToggle = cachedBudgets[budgetIndex];
    if (!budgetToToggle) return;

    const newCachedBudgets = [...cachedBudgets];
    newCachedBudgets[budgetIndex] = { ...budgetToToggle, show: !budgetToToggle.show };
    setCachedBudgets(newCachedBudgets);
    if (budgetToToggle.id === selectedBudgetId) setSelectedBudgetId("");
  };

  /** Clears all values, removes all saved data from browser storage */
  const removeAllData = () => {
    flushSync(() => {
      // Ensure token is removed first so we don't refetch API data
      removeToken();
    });
    localStorage.clear();
  };

  return {
    tokenData,
    setTokenData,
    settings,
    changeSetting,
    cachedBudgets,
    setCachedBudgets,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudgetData,
    toggleShowBudget,
    savedCategories,
    saveCategory,
    removeCategory,
    savedAccounts,
    saveAccount,
    removeAccount,
    removeAllData
  };
};

const { BaseContext, Provider } = createProvider(useStorageProvider);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(BaseContext);
export const StorageProvider = Provider;
