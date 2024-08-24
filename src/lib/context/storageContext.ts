import { createProvider } from "puro";
import { useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import useLocalStorage from "use-local-storage-state";

import { Storage } from "@plasmohq/storage";
import { useStorage as useExtensionStorage } from "@plasmohq/storage/hook";

import {
  DEFAULT_BUDGET_SETTINGS,
  DEFAULT_SETTINGS,
  REFRESH_NEEDED_KEY,
  TOKEN_STORAGE_KEY
} from "~lib/constants";
import type {
  AppSettings,
  BudgetSettings,
  DetailViewState,
  MoveMoneyInitialState,
  TokenData,
  TxAddInitialState
} from "~lib/types";

/** Map of budget IDs to string arrays. */
interface BudgetToStringArrayMap {
  [budgetId: string]: string[] | undefined;
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
    view: "main" | "txAdd" | "detail" | "move";
    editMode?: boolean;
    txAddState?: TxAddInitialState;
    detailState?: DetailViewState;
    moveMoneyState?: MoveMoneyInitialState;
  }>({
    view: "main",
    editMode: false
  });

  /** Whether syncing is enabled */
  const [syncEnabled, setSyncEnabled] = useLocalStorage<boolean>("sync", {
    defaultValue: false
  });

  /** Save the `syncEnabled` setting to Chrome local storage for background thread */
  useEffect(() => {
    CHROME_LOCAL_STORAGE.get<boolean>("sync").then((val) => {
      if (val !== syncEnabled) CHROME_LOCAL_STORAGE.set("sync", syncEnabled);
    });
  }, [syncEnabled]);

  const storageArea = useMemo(
    () => (syncEnabled ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE),
    [syncEnabled]
  );

  /** Extension settings. Is synced if the user chooses. */
  const [settings, setSettings] = useExtensionStorage<AppSettings | undefined>(
    { key: "settings", instance: storageArea },
    (data, isHydrated) => (!isHydrated ? undefined : !data ? DEFAULT_SETTINGS : data)
  );

  /** Keep theme setting synced to localStorage. This helps avoid the 'flash' - see also `public/scripts/theme.js` */
  const [themeLocalSetting, setThemeLocalSetting] = useLocalStorage<
    "light" | "dark" | "auto"
  >("theme", { defaultValue: "auto" });
  useEffect(() => {
    if (settings?.theme && themeLocalSetting !== settings.theme)
      setThemeLocalSetting(settings.theme);
  }, [settings?.theme, themeLocalSetting, setThemeLocalSetting]);

  /** Budgets that the user has selected to show. Is synced if the user chooses. */
  const [shownBudgetIds, setShownBudgetIds] = useExtensionStorage<undefined | string[]>(
    { key: "budgets", instance: storageArea },
    (data, isHydrated) => {
      if (!isHydrated) return undefined;
      else if (!data) return selectedBudgetId ? [selectedBudgetId] : [];
      return data;
    }
  );

  /** Budget-specific settings for the current budget. Is synced if the user chooses. */
  const [budgetSettings, setBudgetSettings] = useExtensionStorage<
    BudgetSettings | undefined
  >(
    {
      key: `budget-${selectedBudgetId}`,
      instance: storageArea
    },
    (data, isHydrated) =>
      !isHydrated ? undefined : !data ? DEFAULT_BUDGET_SETTINGS : data
  );

  /** Use budget-specific settings for a specific budget */
  const useBudgetSettings = (budgetId: string) =>
    useExtensionStorage<BudgetSettings | undefined>(
      {
        key: `budget-${budgetId}`,
        instance: storageArea
      },
      (data, isHydrated) =>
        !isHydrated ? undefined : !data ? DEFAULT_BUDGET_SETTINGS : data
    );

  /** The category IDs pinned by the user, grouped by budgetId. Is synced if the user chooses. */
  const [
    savedCategories,
    setSavedCategories,
    { setRenderValue: setSavedCategoriesRender }
  ] = useExtensionStorage<BudgetToStringArrayMap | undefined>(
    { key: "cats", instance: storageArea },
    (data, isHydrated) => (!isHydrated ? undefined : !data ? {} : data)
  );

  /** The account IDs pinned by the user, grouped by budgetId. Is synced if the user chooses. */
  const [savedAccounts, setSavedAccounts, { setRenderValue: setSavedAccountsRender }] =
    useExtensionStorage<BudgetToStringArrayMap | undefined>(
      { key: "accounts", instance: storageArea },
      (data, isHydrated) => (!isHydrated ? undefined : !data ? {} : data)
    );

  const changeSetting = <K extends keyof AppSettings | "sync">(
    key: K,
    newValue: K extends keyof AppSettings ? AppSettings[K] : boolean
  ) => {
    if (key === "sync" && typeof newValue === "boolean") setSyncEnabled(newValue);
    else
      setSettings((prevSettings) =>
        prevSettings ? { ...prevSettings, [key]: newValue } : prevSettings
      );
  };

  /** Save/pin a category for the currently selected budget */
  const saveCategory = (categoryIdToSave: string) => {
    const foundDuplicate = savedCategories?.[selectedBudgetId]?.find(
      (categoryId) => categoryId === categoryIdToSave
    );
    if (foundDuplicate) return;
    setSavedCategories({
      ...savedCategories,
      [selectedBudgetId]: [
        ...(savedCategories?.[selectedBudgetId] || []),
        categoryIdToSave
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

  /** Remove/unpin a category for the currently selected budget */
  const removeCategory = (categoryIdToRemove: string) => {
    setSavedCategories({
      ...savedCategories,
      [selectedBudgetId]: savedCategories?.[selectedBudgetId]?.filter(
        (categoryId) => categoryId !== categoryIdToRemove
      )
    });
  };

  /** Save/pin an account for the currently selected budget */
  const saveAccount = (accountIdToSave: string) => {
    const foundDuplicate = savedAccounts?.[selectedBudgetId]?.find(
      (accountId) => accountId === accountIdToSave
    );
    if (foundDuplicate) return;
    setSavedAccounts({
      ...savedAccounts,
      [selectedBudgetId]: [...(savedAccounts?.[selectedBudgetId] || []), accountIdToSave]
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

  /** Remove/unpin an account for the currently selected budget */
  const removeAccount = (accountIdToRemove: string) => {
    setSavedAccounts({
      ...savedAccounts,
      [selectedBudgetId]: savedAccounts?.[selectedBudgetId]?.filter(
        (accountId) => accountId !== accountIdToRemove
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
      // Clean up saved categories and accounts for this budget
      setSavedCategories({
        ...savedCategories,
        [budgetId]: undefined
      });
      setSavedAccounts({
        ...savedAccounts,
        [budgetId]: undefined
      });
      // Clean up budget-specific settings
      storageArea.remove(`budget-${budgetId}`);
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
    budgetSettings,
    setBudgetSettings,
    useBudgetSettings,
    removeAccount,
    removeAllData
  };
};

const { BaseContext, Provider } = createProvider(useStorageProvider);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(BaseContext);
export const StorageProvider = Provider;
