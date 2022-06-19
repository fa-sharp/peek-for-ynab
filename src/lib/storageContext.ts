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
    { key: "tokenData", area: "local" },
    null
  );

  const [cachedBudgets, setCachedBudgets, { remove: removeCachedBudgets }] = useStorage<
    null | CachedBudget[]
  >({ key: "cachedBudgets", area: "local" }, null);

  const [selectedBudgetId, setSelectedBudgetId, { remove: removeSelectedBudget }] =
    useStorage({ key: "selectedBudgetId", area: "local" }, "");

  const [savedCategories, setSavedCategories, { remove: removeSavedCategories }] =
    useStorage<SavedCategory[]>({ key: "savedCategories", area: "local" }, []);

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
  const toggleShowBudget = (budgetId: string) => {
    if (!cachedBudgets) return;
    const budgetIndex = cachedBudgets.findIndex((budget) => budget.id === budgetId);
    const budgetToToggle = cachedBudgets[budgetIndex];
    if (!budgetToToggle) return;

    const newCachedBudgets = [...cachedBudgets];
    newCachedBudgets[budgetIndex] = { ...budgetToToggle, show: !budgetToToggle.show };
    setCachedBudgets(newCachedBudgets);
  };

  const removeAllData = async () => {
    await setTokenData(null);
    removeToken();

    await setSelectedBudgetId("");
    removeSelectedBudget();

    await setSavedCategories([]);
    removeSavedCategories();

    await setCachedBudgets(null);
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
    /** Toggle whether a budget is shown or not. */
    toggleShowBudget,
    /** The categories saved by the user */
    savedCategories,
    /** Save/pin a category */
    saveCategory,
    /** Remove/unsave a category  */
    removeCategory,
    /** Clears all values, removes all saved data from browser storage */
    removeAllData
  };
};

const { BaseContext, Provider } = createProvider(useStorageProvider);

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(BaseContext);
export const StorageProvider = Provider;
