import { createProvider } from "puro";
import { useContext, useMemo } from "react";
import { flushSync } from "react-dom";
import useLocalStorage from "use-local-storage-state";

import { Storage } from "@plasmohq/storage";
import { useStorage as useExtensionStorage } from "@plasmohq/storage/hook";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

export interface AppSettings {
  /** Whether to fetch and show accounts from each budget */
  showAccounts: boolean;
  /** Whether to enable adding transactions */
  txEnabled: boolean;
  /** Whether transactions are marked Cleared by default */
  txCleared: boolean;
  /** Whether transactions are automatically marked Approved */
  txApproved: boolean;
  /** Category and account names are reduced to emojis */
  emojiMode: boolean;
  /** Balances are hidden unless you hover over them */
  privateMode: boolean;
  /** Whether data is synced to the user's Chrome profile */
  sync: boolean;
  /** Whether access is allowed to current tab for extra features */
  currentTabAccess: boolean;
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

export const TOKEN_STORAGE_KEY = "tokenData";
export const REFRESH_NEEDED_KEY = "tokenRefreshing";

export const TOKEN_STORAGE = new Storage({ area: "local" });
const CHROME_LOCAL_STORAGE = new Storage({ area: "local", allCopied: true });
const CHROME_SYNC_STORAGE = new Storage({ area: "sync", allCopied: true });

const useStorageProvider = () => {
  /** The token used to authenticate the YNAB user */
  const [tokenData, setTokenData, { remove: removeToken }] = useExtensionStorage<
    TokenData | null | undefined
  >({ key: TOKEN_STORAGE_KEY, instance: TOKEN_STORAGE }, (data, isHydrated) =>
    !isHydrated ? undefined : !data ? null : data
  );
  /** Whether the token needs to be refreshed */
  const [tokenRefreshNeeded, setTokenRefreshNeeded] = useExtensionStorage<boolean>(
    { key: REFRESH_NEEDED_KEY, instance: TOKEN_STORAGE },
    false
  );

  const [settings, setSettings] = useLocalStorage<AppSettings>("settings", {
    defaultValue: {
      showAccounts: true,
      txEnabled: true,
      txApproved: true,
      txCleared: false,
      privateMode: false,
      emojiMode: false,
      sync: false,
      currentTabAccess: false
    }
  });

  /** The budget currently in view */
  const [selectedBudgetId, setSelectedBudgetId] = useLocalStorage("selectedBudget", {
    defaultValue: ""
  });

  const storageArea = useMemo(
    () => (settings.sync ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE),
    [settings.sync]
  );

  /** Budgets that the user has selected to show. Is synced if the user chooses. */
  const [shownBudgetIds, setShownBudgetIds] = useExtensionStorage<undefined | string[]>(
    { key: "budgets", instance: storageArea },
    (data, isHydrated) => {
      if (!isHydrated) return undefined;
      else if (!data) {
        return selectedBudgetId ? [selectedBudgetId] : [];
      }
      return data;
    }
  );

  /** The category IDs pinned by the user, grouped by budgetId. Is synced if the user chooses. */
  const [savedCategories, setSavedCategories] = useExtensionStorage<
    | undefined
    | {
        [budgetId: string]: string[] | undefined;
      }
  >({ key: "cats", instance: storageArea }, (data, isHydrated) =>
    !isHydrated ? undefined : !data ? {} : data
  );

  /** The account IDs pinned by the user, grouped by budgetId. Is synced if the user chooses. */
  const [savedAccounts, setSavedAccounts] = useExtensionStorage<
    | undefined
    | {
        [budgetId: string]: string[] | undefined;
      }
  >({ key: "accounts", instance: storageArea }, (data, isHydrated) =>
    !isHydrated ? undefined : !data ? {} : data
  );

  const changeSetting = <K extends keyof AppSettings>(
    key: K,
    newValue: AppSettings[K]
  ) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: newValue }));
  };

  const saveCategory = (newCategory: SavedCategory) => {
    const foundDuplicate = savedCategories?.[newCategory.budgetId]?.find(
      (categoryId) => categoryId === newCategory.categoryId
    );
    if (!foundDuplicate)
      setSavedCategories({
        ...savedCategories,
        [newCategory.budgetId]: [
          ...(savedCategories?.[newCategory.budgetId] || []),
          newCategory.categoryId
        ]
      });
  };
  const removeCategory = (savedCategory: SavedCategory) => {
    setSavedCategories({
      ...savedCategories,
      [savedCategory.budgetId]: savedCategories?.[savedCategory.budgetId]?.filter(
        (categoryId) => categoryId !== savedCategory.categoryId
      )
    });
  };
  const saveAccount = (newAccount: SavedAccount) => {
    const foundDuplicate = savedAccounts?.[newAccount.budgetId]?.find(
      (accountId) => accountId === newAccount.accountId
    );
    if (!foundDuplicate)
      setSavedAccounts({
        ...savedAccounts,
        [newAccount.budgetId]: [
          ...(savedAccounts?.[newAccount.budgetId] || []),
          newAccount.accountId
        ]
      });
  };
  const removeAccount = (savedAccount: SavedAccount) => {
    setSavedAccounts({
      ...savedAccounts,
      [savedAccount.budgetId]: savedAccounts?.[savedAccount.budgetId]?.filter(
        (accountId) => accountId !== savedAccount.accountId
      )
    });
  };

  /** Toggle whether a budget is shown or not. */
  const toggleShowBudget = (budgetId: string) => {
    if (!shownBudgetIds) return;
    // hide budget
    if (shownBudgetIds.includes(budgetId)) {
      setShownBudgetIds(shownBudgetIds.filter((id) => id !== budgetId));
      if (selectedBudgetId === budgetId) setSelectedBudgetId("");
      // TODO should we delete saved accounts and categories for this budget?
    }
    // show budget
    else setShownBudgetIds([...shownBudgetIds, budgetId]);
  };

  /** Clears all values, removes all saved data from browser storage */
  const removeAllData = async () => {
    flushSync(() => {
      // Ensure token is removed first so we don't refetch API data
      removeToken();
    });
    await chrome.storage.local.clear();
    localStorage.clear();
  };

  return {
    tokenData,
    setTokenData,
    tokenRefreshNeeded,
    setTokenRefreshNeeded,
    settings,
    changeSetting,
    selectedBudgetId,
    setSelectedBudgetId,
    shownBudgetIds,
    setShownBudgetIds,
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
