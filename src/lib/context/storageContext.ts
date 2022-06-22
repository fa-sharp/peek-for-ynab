import { createProvider } from "puro";
import { useContext, useMemo } from "react";
import useLocalStorage from "use-local-storage-state";
import type { CurrencyFormat } from "ynab";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

/** Cached budget data, stored in the browser */
export interface CachedBudget {
  id: string;
  name: string;
  currencyFormat?: CurrencyFormat;
  /** whether the budget is displayed in the main view */
  show: boolean;
}

/** A category saved by the user, stored in the browser */
export interface SavedCategory {
  budgetId: string;
  categoryId: string;
}

const useStorageProvider = () => {
  /** The token used to authenticate the YNAB user */
  const [tokenData, setTokenData, { removeItem: removeToken }] =
    useLocalStorage<TokenData | null>("tokenData", {
      defaultValue: null
    });

  /** Cached API data: List of all user's budgets */
  const [cachedBudgets, setCachedBudgets, { removeItem: removeCachedBudgets }] =
    useLocalStorage<null | CachedBudget[]>("cachedBudgets", { defaultValue: null });

  /** The budget currently in view */
  const [selectedBudgetId, setSelectedBudgetId, { removeItem: removeSelectedBudget }] =
    useLocalStorage("selectedBudgetId", { defaultValue: "" });

  /** The categories saved by the user */
  const [savedCategories, setSavedCategories, { removeItem: removeSavedCategories }] =
    useLocalStorage<SavedCategory[]>("savedCategories", { defaultValue: [] });

  /** Cached API data: Data from the budget currently in view (e.g. name, currency info, etc.) */
  const selectedBudgetData = useMemo(
    () => cachedBudgets?.find((budget) => budget.id === selectedBudgetId) || null,
    [cachedBudgets, selectedBudgetId]
  );
  const saveCategory = (categoryToSave: SavedCategory) => {
    const foundDuplicate = savedCategories.find(
      (savedCategory) => savedCategory.categoryId === categoryToSave.categoryId
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
    removeToken();
    removeSelectedBudget();
    removeSavedCategories();
    removeCachedBudgets();
  };

  return {
    tokenData,
    setTokenData,
    cachedBudgets,
    setCachedBudgets,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudgetData,
    toggleShowBudget,
    savedCategories,
    saveCategory,
    removeCategory,
    removeAllData
  };
};

const { BaseContext, Provider } = createProvider(useStorageProvider);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(BaseContext);
export const StorageProvider = Provider;
