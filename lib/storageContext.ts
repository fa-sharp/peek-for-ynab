import { createProvider } from "puro";
import { useContext } from "react";

import { useStorage } from "@plasmohq/storage";

/** A category saved by the user, stored in the browser */
export interface SavedCategory {
  budgetId: string;
  categoryId: string;
}

const useStorageProvider = () => {
  const [token, setToken, { remove: removeToken }] = useStorage("token", "");

  const [selectedBudget, setSelectedBudget, { remove: removeSelectedBudget }] =
    useStorage("selectedBudget", "");

  const [savedCategories, setSavedCategories, { remove: removeSavedCategories }] =
    useStorage<SavedCategory[]>("savedCategories", []);

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

  const removeAllData = () => {
    setToken("");
    removeToken();

    setSelectedBudget("");
    removeSelectedBudget();

    setSavedCategories([]);
    removeSavedCategories();
  };

  return {
    /** The token used to authenticate the YNAB user */
    token,
    setToken,
    /** The ID of the budget currently in view */
    selectedBudget,
    setSelectedBudget,
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
