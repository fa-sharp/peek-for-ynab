import { createContext, useContext, useEffect, useState } from "react";
import useLocalStorage from "use-local-storage-state";

import {
  useAppSettings,
  useBudgetSettings,
  usePinnedItems,
  usePopupState,
} from "~lib/state";
import type { AppSettings } from "~lib/types";

export const useStorageProvider = () => {
  // UNPERSISTED STATE

  /** Whether user can edit and re-arrange the pinned categories and accounts */
  const [editingItems, setEditingItems] = useState(false);
  /** Omnibox input state */
  const [omniboxInput, setOmniboxInput] = useState("");

  // PERSISTED STATE

  /** Current popup view state. Persisted locally. */
  const [popupState, setPopupState] = usePopupState();

  /** Global settings, including whether user has chosen to sync settings to their browser profile. */
  const { sync, settings, changeSetting, toggleShowBudget } = useAppSettings();

  /** Pinned categories and accounts for the current budget */
  const { pinnedItems, toggleCategory, toggleAccount, setCategories, setAccounts } =
    usePinnedItems(popupState.budgetId, sync, settings);

  /** Budget-specific settings for the current budget. Is synced if the user chooses. */
  const [budgetSettings, setBudgetSettings] = useBudgetSettings(
    popupState.budgetId,
    sync
  );

  /** Get budget settings for a given budget ID, with the current sync option applied. */
  const useBudgetSettingsWithSync = (budgetId: string) =>
    useBudgetSettings(budgetId, sync);

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

  // Wait for essential state to be loaded from Chrome storage to avoid flashes (should only take a few ms)
  if (!settings) return null;

  return {
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
    useBudgetSettings: useBudgetSettingsWithSync,
  };
};

export const StorageContext =
  //@ts-expect-error Context should not return null due to early return in Provider
  createContext<NonNullable<ReturnType<typeof useStorageProvider>>>(null);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(StorageContext);
