import { createProvider } from "puro";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import useLocalStorage from "use-local-storage-state";

import { useStorage as useExtensionStorage } from "@plasmohq/storage/hook";

import {
  CHROME_LOCAL_STORAGE,
  CHROME_SYNC_STORAGE,
  DEFAULT_BUDGET_SETTINGS,
  DEFAULT_POPUP_STATE,
  DEFAULT_SETTINGS,
  REFRESH_SIGNAL_KEY,
  TOKEN_STORAGE,
  TOKEN_STORAGE_KEY
} from "~lib/constants";
import type { AppSettings, BudgetSettings, PopupState, TokenData } from "~lib/types";

/** Map of budget IDs to string arrays. Useful type for storage. */
interface BudgetToStringArrayMap {
  [budgetId: string]: string[] | undefined;
}

const useStorageProvider = () => {
  /** The token used to authenticate the YNAB user. Stored locally. */
  const [tokenData, setTokenData, { remove: removeToken }] = useExtensionStorage<
    TokenData | null | undefined
  >({ key: TOKEN_STORAGE_KEY, instance: TOKEN_STORAGE }, (data, isHydrated) =>
    !isHydrated ? undefined : !data ? null : data
  );

  /** Whether the token needs refreshing. Setting this to `true` will trigger a background job to refresh token. */
  const [tokenRefreshNeeded, setTokenRefreshNeeded] = useExtensionStorage<boolean>(
    { key: REFRESH_SIGNAL_KEY, instance: TOKEN_STORAGE },
    false
  );

  /** Current state of popup (persisted locally) */
  const [popupState, _setPopupState, { setRenderValue: _setPopupRender }] =
    useExtensionStorage<PopupState | undefined>(
      { key: "popupState", instance: CHROME_LOCAL_STORAGE },
      (data, isHydrated) => (!isHydrated ? undefined : !data ? DEFAULT_POPUP_STATE : data)
    );

  /** Partial update of popup state */
  const setPopupState = useCallback(
    (newState: Partial<PopupState>) => {
      if (!popupState) return;
      const newPopupState = { ...popupState, ...newState };
      _setPopupRender(newPopupState); // ensure popup state change is rendered ASAP
      _setPopupState(newPopupState);
    },
    [_setPopupRender, _setPopupState, popupState]
  );

  /** Whether user can edita and re-arrange the pinned categories and accounts */
  const [editingItems, setEditingItems] = useState(false);

  /** Omnibox input state */
  const [omniboxInput, setOmniboxInput] = useState("");

  /** Whether syncing of settings is enabled (persisted in extension storage) */
  const [syncEnabledInStorage, setSyncEnabledInStorage] = useExtensionStorage<
    boolean | undefined
  >({ key: "sync", instance: CHROME_LOCAL_STORAGE }, (val, isHydrated) =>
    !isHydrated ? undefined : !val ? false : val
  );

  /** Keep `syncEnabled` setting synced to localStorage, in order to make it synchronous for the subsequent hooks */
  const [syncEnabledLocal, setSyncEnabledLocal] = useLocalStorage<boolean>("sync", {
    defaultValue: false
  });
  useEffect(() => {
    if (syncEnabledInStorage !== undefined && syncEnabledInStorage !== syncEnabledLocal) {
      setSyncEnabledLocal(syncEnabledInStorage);
      location.reload(); // need to refresh the page, since the Storage hooks won't automatically update
    }
  }, [setSyncEnabledLocal, syncEnabledInStorage, syncEnabledLocal]);

  const storageArea = useMemo(
    () => (syncEnabledLocal ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE),
    [syncEnabledLocal]
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
    if (key === "sync" && typeof newValue === "boolean")
      setSyncEnabledInStorage(newValue);
    else
      setSettings((prevSettings) =>
        prevSettings ? { ...prevSettings, [key]: newValue } : prevSettings
      );
  };

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
    if (!popupState) return;
    setSavedCategories({
      ...savedCategories,
      [popupState.budgetId]: savedCategories?.[popupState.budgetId]?.filter(
        (categoryId) => categoryId !== categoryIdToRemove
      )
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
        accountIdToSave
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

  /** Remove/unpin an account for the currently selected budget */
  const removeAccount = (accountIdToRemove: string) => {
    if (!popupState) return;
    setSavedAccounts({
      ...savedAccounts,
      [popupState.budgetId]: savedAccounts?.[popupState.budgetId]?.filter(
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
      if (popupState?.budgetId === budgetId) setPopupState({ budgetId: "" });
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
    editingItems,
    setEditingItems,
    omniboxInput,
    setOmniboxInput,
    settings,
    syncEnabled: syncEnabledInStorage,
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
    removeAllData
  };
};

const { BaseContext, Provider } = createProvider(useStorageProvider);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(BaseContext);
export const StorageProvider = Provider;
