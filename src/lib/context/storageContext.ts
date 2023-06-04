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
  /** Whether transactions are automatically marked Approved */
  txApproved: boolean;
  /** Category and account names are reduced to emojis */
  emojiMode: boolean;
  /** Balances are hidden unless you hover over them */
  privateMode: boolean;
  /** Whether data is synced to the user's Chrome profile */
  sync: boolean;
}

const tokenStorage = new Storage({ area: "local" });
const chromeLocalStorage = new Storage({ area: "local", allCopied: true });
const chromeSyncStorage = new Storage({ area: "sync", allCopied: true });

const useStorageProvider = () => {
  /** The token used to authenticate the YNAB user */
  const [tokenData, setTokenData, { remove: removeToken }] = useExtensionStorage<
    TokenData | null | undefined
  >({ key: "tokenData", instance: tokenStorage }, (data, isHydrated) =>
    !isHydrated ? undefined : !data ? null : data
  );

  const [settings, setSettings] = useLocalStorage<AppSettings>("settings", {
    defaultValue: {
      showAccounts: true,
      txEnabled: false,
      txApproved: false,
      privateMode: false,
      emojiMode: false,
      sync: false
    }
  });

  /** The budget currently in view */
  const [selectedBudgetId, setSelectedBudgetId] = useLocalStorage("selectedBudgetId", {
    defaultValue: ""
  });

  const storageArea = useMemo(
    () =>
      settings.sync
        ? new Storage({ area: "sync", allCopied: true })
        : new Storage({ area: "local", allCopied: true }),
    [settings.sync]
  );

  /** Budgets that the user has selected to show. Is synced if the user chooses. */
  const [shownBudgetIds, setShownBudgetIds] = useExtensionStorage<null | string[]>(
    {
      key: "shownBudgetIds",
      instance: new Storage({ area: settings.sync ? "sync" : "local", allCopied: true })
    },
    (data, isHydrated) => (!isHydrated ? null : !data ? [] : data)
  );

  /** The pinned category IDs for the selected budget. Is synced if the user chooses. */
  const [savedCategories, setSavedCategories] = useExtensionStorage<string[]>(
    {
      key: `categories-${selectedBudgetId}`,
      instance: new Storage({ area: settings.sync ? "sync" : "local", allCopied: true })
    },
    (data, isHydrated) => (!isHydrated ? [] : !data ? [] : data)
  );

  /** The pinned account IDs for the selected budget. Is synced if the user chooses. */
  const [savedAccounts, setSavedAccounts] = useExtensionStorage<string[]>(
    {
      key: `accounts-${selectedBudgetId}`,
      instance: new Storage({ area: settings.sync ? "sync" : "local", allCopied: true })
    },
    (data, isHydrated) => (!isHydrated ? [] : !data ? [] : data)
  );

  const changeSetting = <K extends keyof AppSettings>(
    key: K,
    newValue: AppSettings[K]
  ) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: newValue }));
  };

  const saveCategory = (categoryId: string) => {
    const foundDuplicate = savedCategories.find((id) => id === categoryId);
    if (!foundDuplicate) setSavedCategories([...savedCategories, categoryId]);
  };
  const removeCategory = (categoryId: string) => {
    setSavedCategories(savedCategories.filter((id) => id !== categoryId));
  };
  const saveAccount = (accountId: string) => {
    const foundDuplicate = savedAccounts.find((id) => id === accountId);
    if (!foundDuplicate) setSavedAccounts([...savedAccounts, accountId]);
  };
  const removeAccount = (accountId: string) => {
    setSavedAccounts(savedAccounts.filter((id) => id !== accountId));
  };

  /** Toggle whether a budget is shown or not. */
  const toggleShowBudget = (budgetId: string) => {
    if (!shownBudgetIds) return;
    // hide budget
    if (shownBudgetIds.includes(budgetId)) {
      setShownBudgetIds(shownBudgetIds.filter((id) => id !== budgetId));
      if (selectedBudgetId === budgetId) setSelectedBudgetId("");
      // delete saved accounts and categories for this budget
      storageArea.remove(`categories-${selectedBudgetId}`);
      storageArea.remove(`accounts-${selectedBudgetId}`);
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
