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

/** Customizable options for a budget */
interface SavedBudgetOptions {
  /** Pinned category IDs */
  cats: string[];
  /** Pinned account IDs */
  accounts: string[];
}

export interface TxAddInitialState {
  accountId?: string;
  categoryId?: string;
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

  /** Whether the token needs refreshing. Setting this to `true` will trigger a background job to refresh the token. */
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

  /** Customizable options for the current budget (pinned categories, accounts, etc.). Synced if the user chooses. */
  const [budgetOptions, setBudgetOptions, { setRenderValue: setBudgetOptionsRender }] =
    useExtensionStorage<SavedBudgetOptions | undefined>(
      { key: `budget-${selectedBudgetId}`, instance: storageArea },
      (data, isHydrated) =>
        !isHydrated ? undefined : !data ? { cats: [], accounts: [] } : data
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

  const saveCategory = (categoryIdToSave: string) => {
    if (!budgetOptions) return;
    const foundDuplicate = budgetOptions.cats.find((id) => id === categoryIdToSave);
    if (!foundDuplicate)
      setBudgetOptions({
        ...budgetOptions,
        cats: [...budgetOptions.cats, categoryIdToSave]
      });
  };
  const saveCategories = (categoryIds: string[]) => {
    if (!budgetOptions) return;
    const newBudgetOptions = {
      ...budgetOptions,
      cats: categoryIds
    };
    setBudgetOptionsRender(newBudgetOptions);
    setBudgetOptions(newBudgetOptions);
  };
  const removeCategory = (categoryIdToRemove: string) => {
    if (!budgetOptions) return;
    setBudgetOptions({
      ...budgetOptions,
      cats: budgetOptions.cats.filter((categoryId) => categoryId !== categoryIdToRemove)
    });
  };
  const saveAccount = (accountIdToSave: string) => {
    if (!budgetOptions) return;
    const foundDuplicate = budgetOptions.accounts.find((id) => id === accountIdToSave);
    if (!foundDuplicate)
      setBudgetOptions({
        ...budgetOptions,
        accounts: [...budgetOptions.accounts, accountIdToSave]
      });
  };
  const saveAccounts = (accountIds: string[]) => {
    if (!budgetOptions) return;
    const newBudgetOptions = {
      ...budgetOptions,
      accounts: accountIds
    };
    setBudgetOptionsRender(newBudgetOptions);
    setBudgetOptions(newBudgetOptions);
  };
  const removeAccount = (accountIdToRemove: string) => {
    if (!budgetOptions) return;
    setBudgetOptions({
      ...budgetOptions,
      accounts: budgetOptions.accounts.filter((id) => id !== accountIdToRemove)
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
    budgetOptions,
    setBudgetOptions,
    saveCategory,
    saveCategories,
    saveAccounts,
    removeCategory,
    saveAccount,
    removeAccount,
    removeAllData
  };
};

const { BaseContext, Provider } = createProvider(useStorageProvider);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(BaseContext);
export const StorageProvider = Provider;
