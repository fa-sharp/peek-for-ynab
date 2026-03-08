import { useStorage as useExtensionStorage } from "@plasmohq/storage/hook";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import useLocalStorage from "use-local-storage-state";

import {
  CHROME_LOCAL_STORAGE,
  CHROME_SYNC_STORAGE,
  DEFAULT_BUDGET_SETTINGS,
} from "~lib/constants";
import { useAppSettings, usePinnedItems, usePopupState, useTokenData } from "~lib/state";
import type { AppSettings, BudgetSettings } from "~lib/types";

export const useStorageProvider = () => {
  // UNPERSISTED STATE

  /** Whether user can edit and re-arrange the pinned categories and accounts */
  const [editingItems, setEditingItems] = useState(false);
  /** Omnibox input state */
  const [omniboxInput, setOmniboxInput] = useState("");

  // PERSISTED STATE

  /** The token used to authenticate the YNAB user. Persisted locally. */
  const tokenState = useTokenData();

  /** Current popup view state. Persisted locally. */
  const [popupState, setPopupState] = usePopupState();

  /** Global settings, including whether user has chosen to sync settings to their browser profile. */
  const { sync, settings, changeSetting, toggleShowBudget } = useAppSettings();

  /** Pinned categories and accounts for the current budget */
  const { pinnedItems, toggleCategory, toggleAccount, setCategories, setAccounts } =
    usePinnedItems(popupState.budgetId, sync);

  const storageArea = useMemo(
    () => (sync ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE),
    [sync]
  );

  /** Keep the global theme setting synced to localStorage. This helps avoid the 'flash' on load.
   *  See also `public/scripts/theme.js` */
  const [themeLocalSetting, setThemeLocalSetting] = useLocalStorage<AppSettings["theme"]>(
    "theme",
    { defaultValue: "auto" }
  );
  useEffect(() => {
    if (settings?.theme && themeLocalSetting !== settings.theme)
      setThemeLocalSetting(settings.theme);
  }, [settings?.theme, themeLocalSetting, setThemeLocalSetting]);

  /** Budget-specific settings for the current budget. Is synced if the user chooses. */
  const [budgetSettings, setBudgetSettings] = useExtensionStorage<
    BudgetSettings | undefined
  >(
    { key: `budget-${popupState.budgetId}`, instance: storageArea },
    (data, isHydrated) =>
      !isHydrated || !popupState.budgetId
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

  // Wait for essential state to be loaded from Chrome storage to avoid flashes (should only take a few ms)
  if (!tokenState || !settings) return null;

  return {
    token: tokenState,
    popupState,
    setPopupState,
    editingItems,
    setEditingItems,
    omniboxInput,
    setOmniboxInput,
    settings,
    settingsSynced: sync,
    changeSetting,
    toggleShowBudget,
    pinnedItems,
    toggleCategory,
    toggleAccount,
    setCategories,
    setAccounts,
    budgetSettings,
    setBudgetSettings,
    useBudgetSettings,
  };
};

export const StorageContext =
  //@ts-expect-error Provider will not actually render a null value
  createContext<NonNullable<ReturnType<typeof useStorageProvider>>>(null);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(StorageContext);
