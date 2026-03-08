import { useStorage as useExtensionStorage } from "@plasmohq/storage/hook";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import useLocalStorage from "use-local-storage-state";

import { browser } from "#imports";
import {
  CHROME_LOCAL_STORAGE,
  CHROME_SYNC_STORAGE,
  DEFAULT_BUDGET_SETTINGS,
} from "~lib/constants";
import { useAppSettings, usePopupState, useTokenData } from "~lib/state";
import type { AppSettings, BudgetSettings } from "~lib/types";

/** Map of budget IDs to string arrays. */
interface BudgetToStringArrayMap {
  [budgetId: string]: string[] | undefined;
}

export const useStorageProvider = () => {
  // Unpersisted state
  /** Whether user can edit and re-arrange the pinned categories and accounts */
  const [editingItems, setEditingItems] = useState(false);
  /** Omnibox input state */
  const [omniboxInput, setOmniboxInput] = useState("");

  // Persisted state
  /** The token used to authenticate the YNAB user. Persisted locally. */
  const tokenState = useTokenData();

  /** Current state of popup. Persisted locally. */
  const [popupState, setPopupState] = usePopupState();

  /** Global settings, including whether user has chosen to sync settings to their profile. */
  const { sync, settings, changeSetting } = useAppSettings();

  const storageArea = useMemo(
    () => (sync ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE),
    [sync]
  );

  /** Keep theme setting synced to localStorage. This helps avoid the 'flash' - see also `public/scripts/theme.js` */
  const [themeLocalSetting, setThemeLocalSetting] = useLocalStorage<AppSettings["theme"]>(
    "theme",
    { defaultValue: "auto" }
  );
  useEffect(() => {
    if (settings?.theme && themeLocalSetting !== settings.theme)
      setThemeLocalSetting(settings.theme);
  }, [settings?.theme, themeLocalSetting, setThemeLocalSetting]);

  /** Budgets that the user has selected to show. Is synced if the user chooses. */
  const [shownBudgetIds, setShownBudgetIds] = useExtensionStorage<undefined | string[]>(
    { key: "budgets", instance: storageArea },
    (data, isHydrated) => {
      if (!isHydrated) return undefined;
      else if (!data) return popupState?.budgetId ? [popupState.budgetId] : [];
      return data;
    }
  );

  /** Budget-specific settings for the current budget. Is synced if the user chooses. */
  const [budgetSettings, setBudgetSettings] = useExtensionStorage<
    BudgetSettings | undefined
  >(
    { key: `budget-${popupState?.budgetId}`, instance: storageArea },
    (data, isHydrated) =>
      !isHydrated || !popupState?.budgetId
        ? undefined
        : !data
          ? DEFAULT_BUDGET_SETTINGS
          : data
  );

  /** Get settings for a specific budget */
  const useBudgetSettings = (budgetId: string) =>
    useExtensionStorage<BudgetSettings | undefined>(
      { key: `budget-${budgetId}`, instance: storageArea },
      (data, isHydrated) =>
        !isHydrated ? undefined : !data ? DEFAULT_BUDGET_SETTINGS : data
    );

  /** The category IDs pinned by the user, grouped by budgetId. Is synced if the user chooses. */
  const [
    savedCategories,
    setSavedCategories,
    { setRenderValue: setSavedCategoriesRender },
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

  /** Save/pin a category for the currently selected budget */
  const saveCategory = (categoryIdToSave: string) => {
    if (!popupState) return;
    const foundDuplicate = savedCategories?.[popupState.budgetId]?.find(
      (categoryId) => categoryId === categoryIdToSave
    );
    if (foundDuplicate) return;
    setSavedCategories({
      ...savedCategories,
      [popupState.budgetId]: [
        ...(savedCategories?.[popupState.budgetId] || []),
        categoryIdToSave,
      ],
    });
  };

  const saveCategoriesForBudget = (budgetId: string, categoryIds: string[]) => {
    const newSavedCategories = {
      ...savedCategories,
      [budgetId]: categoryIds,
    };
    setSavedCategoriesRender(newSavedCategories);
    setSavedCategories(newSavedCategories);
  };

  /** Remove/unpin a category for the currently selected budget */
  const removeCategory = (categoryIdToRemove: string) => {
    if (!popupState) return;
    setSavedCategories({
      ...savedCategories,
      [popupState.budgetId]: savedCategories?.[popupState.budgetId]?.filter(
        (categoryId) => categoryId !== categoryIdToRemove
      ),
    });
  };

  /** Save/pin an account for the currently selected budget */
  const saveAccount = (accountIdToSave: string) => {
    if (!popupState) return;
    const foundDuplicate = savedAccounts?.[popupState.budgetId]?.find(
      (accountId) => accountId === accountIdToSave
    );
    if (foundDuplicate) return;
    setSavedAccounts({
      ...savedAccounts,
      [popupState.budgetId]: [
        ...(savedAccounts?.[popupState.budgetId] || []),
        accountIdToSave,
      ],
    });
  };

  const saveAccountsForBudget = (budgetId: string, accountIds: string[]) => {
    const newSavedAccounts = {
      ...savedAccounts,
      [budgetId]: accountIds,
    };
    setSavedAccountsRender(newSavedAccounts);
    setSavedAccounts(newSavedAccounts);
  };

  /** Remove/unpin an account for the currently selected budget */
  const removeAccount = (accountIdToRemove: string) => {
    if (!popupState) return;
    setSavedAccounts({
      ...savedAccounts,
      [popupState.budgetId]: savedAccounts?.[popupState.budgetId]?.filter(
        (accountId) => accountId !== accountIdToRemove
      ),
    });
  };

  /** Toggle whether a budget is shown or not. */
  const toggleShowBudget = (budgetId: string) => {
    if (!shownBudgetIds) return;
    // hide budget
    if (shownBudgetIds.includes(budgetId)) {
      setShownBudgetIds(shownBudgetIds.filter((id) => id !== budgetId));
      if (popupState?.budgetId === budgetId) {
        setPopupState({
          view: "main",
          budgetId: "",
        });
      }
    }
    // show budget
    else setShownBudgetIds([...shownBudgetIds, budgetId]);
  };

  /** Clears all values, removes all locally saved data from browser storage */
  const removeAllData = async () => {
    await tokenState?.setTokenData(null);
    await browser.storage.local.clear();
    localStorage.clear();
  };

  // Wait for essential state to be loaded from Chrome storage (should only take a few ms)
  if (!tokenState || !popupState || !settings) return null;

  return {
    token: tokenState,
    popupState,
    setPopupState,
    editingItems,
    setEditingItems,
    omniboxInput,
    setOmniboxInput,
    settingsSynced: sync,
    settings,
    changeSetting,
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
    removeAllData,
  };
};

export const StorageContext =
  //@ts-expect-error Provider will not actually render a null value
  createContext<NonNullable<ReturnType<typeof useStorageProvider>>>(null);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(StorageContext);
