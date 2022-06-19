import { createProvider } from "puro";
import { useContext, useMemo } from "react";
import type { CurrencyFormat } from "ynab";

import { useStorage } from "@plasmohq/storage";

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
  const [tokenData, setTokenData, { remove: removeToken }] = useStorage<TokenData | null>(
    "tokenData",
    null
  );

  const [cachedBudgets, setCachedBudgets, { remove: removeCachedBudgets }] = useStorage<
    null | CachedBudget[]
  >("cachedBudgets", null);

  const [selectedBudgetId, setSelectedBudgetId, { remove: removeSelectedBudget }] =
    useStorage("selectedBudgetId", "");

  const selectedBudgetData = useMemo(
    () => cachedBudgets?.find((budget) => budget.id === selectedBudgetId) || null,
    [cachedBudgets, selectedBudgetId]
  );

  const [savedCategories, setSavedCategories, { remove: removeSavedCategories }] =
    useStorage<SavedCategory[]>("savedCategories", []);

  /** Save/pin a category */
  const saveCategory = (categoryToSave: SavedCategory) => {
    const foundDuplicate = savedCategories.find(
      (savedCategory) => savedCategory.categoryId === categoryToSave.categoryId
    );
    if (!foundDuplicate) setSavedCategories([...savedCategories, categoryToSave]);
  };
  /** Remove/unsave a category  */
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
  };

  /** Clears all values, removes all saved data from browser storage */
  const removeAllData = () => {
    setTokenData(null);
    removeToken();

    setSelectedBudgetId("");
    removeSelectedBudget();

    setSavedCategories([]);
    removeSavedCategories();

    setCachedBudgets(null);
    removeCachedBudgets();
  };

  return {
    /** The token used to authenticate the YNAB user */
    tokenData,
    setTokenData,
    /** Cached API data: List of all user's budgets */
    cachedBudgets,
    setCachedBudgets,
    /** The ID of the budget currently in view */
    selectedBudgetId,
    setSelectedBudgetId,
    /** Cached API data: Data from the budget currently in view (e.g. name, currency info, etc.) */
    selectedBudgetData,
    /** The categories saved by the user */
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
