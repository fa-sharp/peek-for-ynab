import { createProvider } from "puro";
import { useContext, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import useLocalStorage from "use-local-storage-state";

import { Storage } from "@plasmohq/storage";
import { useStorage as useExtensionStorage } from "@plasmohq/storage/hook";

import { DEFAULT_SETTINGS, REFRESH_NEEDED_KEY, TOKEN_STORAGE_KEY } from "~lib/constants";

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
}

export interface TxAddInitialState {
  accountId?: string;
  categoryId?: string;
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

const TOKEN_STORAGE = new Storage({ area: "local" });
const CHROME_LOCAL_STORAGE = new Storage({ area: "local" });
const CHROME_SYNC_STORAGE = new Storage({ area: "sync" });

const useStorageProvider = () => {
  /** The token used to authenticate the YNAB user. Stored locally. */
  const [tokenData, setTokenData, { remove: removeToken }] = useExtensionStorage<
    TokenData | null | undefined
  >({ key: TOKEN_STORAGE_KEY, instance: TOKEN_STORAGE }, (data, isHydrated) =>
    !isHydrated ? undefined : !data ? null : data
  );

  /** Whether the token needs refreshing. Setting this to `true` will trigger a background job to refresh token. */
  const [tokenRefreshNeeded, setTokenRefreshNeeded] = useExtensionStorage<boolean>(
    { key: REFRESH_NEEDED_KEY, instance: TOKEN_STORAGE },
    false
  );

  /** The budget currently in view */
  const [selectedBudgetId, setSelectedBudgetId] = useLocalStorage("selectedBudget", {
    defaultValue: ""
  });

  /** Current popup state - not persisted */
  const [popupState, setPopupState] = useState<{
    view: "main" | "txAdd";
    editMode?: boolean;
    txAddState?: TxAddInitialState;
  }>({
    view: "main",
    editMode: false
  });

  /** Whether syncing is enabled */
  const [syncEnabled, setSyncEnabled] = useLocalStorage<boolean>("sync", {
    defaultValue: false
  });

  const storageArea = useMemo(
    () => (syncEnabled ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE),
    [syncEnabled]
  );

  /** Extension settings. Is synced if the user chooses. */
  const [settings, setSettings] = useExtensionStorage<AppSettings | undefined>(
    { key: "settings", instance: storageArea },
    (data, isHydrated) => (!isHydrated ? undefined : !data ? DEFAULT_SETTINGS : data)
  );

  /** Budgets that the user has selected to show. Is synced if the user chooses. */
  const [shownBudgetIds, setShownBudgetIds] = useExtensionStorage<undefined | string[]>(
    { key: "budgets", instance: storageArea },
    (data, isHydrated) => {
      if (!isHydrated) return undefined;
      else if (!data) return selectedBudgetId ? [selectedBudgetId] : [];
      // select first budget if no budget is currently selected
      if (data[0] && !selectedBudgetId) setSelectedBudgetId(data[0]);
      return data;
    }
  );

  /** The category IDs pinned by the user, grouped by budgetId. Is synced if the user chooses. */
  const [
    savedCategories,
    setSavedCategories,
    { setRenderValue: setSavedCategoriesRender }
  ] = useExtensionStorage<
    | undefined
    | {
        [budgetId: string]: string[] | undefined;
      }
  >({ key: "cats", instance: storageArea }, (data, isHydrated) =>
    !isHydrated ? undefined : !data ? {} : data
  );

  /** The account IDs pinned by the user, grouped by budgetId. Is synced if the user chooses. */
  const [savedAccounts, setSavedAccounts, { setRenderValue: setSavedAccountsRender }] =
    useExtensionStorage<
      | undefined
      | {
          [budgetId: string]: string[] | undefined;
        }
    >({ key: "accounts", instance: storageArea }, (data, isHydrated) =>
      !isHydrated ? undefined : !data ? {} : data
    );

  const changeSetting = <K extends keyof AppSettings | "sync">(
    key: K,
    newValue: K extends keyof AppSettings ? AppSettings[K] : boolean
  ) => {
    if (key === "sync") setSyncEnabled(newValue);
    else
      setSettings((prevSettings) =>
        prevSettings ? { ...prevSettings, [key]: newValue } : prevSettings
      );
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
  const saveCategoriesForBudget = (budgetId: string, categoryIds: string[]) => {
    const newSavedCategories = {
      ...savedCategories,
      [budgetId]: categoryIds
    };
    setSavedCategoriesRender(newSavedCategories);
    setSavedCategories(newSavedCategories);
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
  const saveAccountsForBudget = (budgetId: string, accountIds: string[]) => {
    const newSavedAccounts = {
      ...savedAccounts,
      [budgetId]: accountIds
    };
    setSavedAccountsRender(newSavedAccounts);
    setSavedAccounts(newSavedAccounts);
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
    popupState,
    setPopupState,
    settings,
    syncEnabled,
    changeSetting,
    selectedBudgetId,
    setSelectedBudgetId,
    shownBudgetIds,
    setShownBudgetIds,
    toggleShowBudget,
    savedCategories,
    saveCategory,
    saveCategoriesForBudget,
    saveAccountsForBudget,
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
