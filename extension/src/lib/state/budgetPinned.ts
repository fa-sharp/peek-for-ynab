import { useCallback, useMemo } from "react";

import { storage } from "#imports";
import { STORAGE_KEYS } from "~lib/constants";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

/** Shape of the pinned items storage for each budget */
interface PinnedItemsStorage {
  /** IDs of the pinned categories */
  categories: string[];
  /** IDs of the pinned accounts */
  accounts: string[];
}

/** Old shape of the pinned items storage: map of budget IDs to arrays of account/category IDs */
interface BudgetToIdsMap {
  [budgetId: string]: string[] | undefined;
}

export function pinnedItemsStorage(budgetId: string, area: "local" | "sync") {
  return storage.defineItem<PinnedItemsStorage>(
    `${area}:${STORAGE_KEYS.PinnedItems(budgetId)}`,
    {
      fallback: { categories: [], accounts: [] },
      init: async () => {
        // on key creation, migrate from old storage of pinned items
        const oldCatsStr = await storage.getItem<string>(`${area}:cats`);
        const oldAcctStr = await storage.getItem<string>(`${area}:accounts`);
        const oldCats = safeMigrateJsonString<BudgetToIdsMap>({})(oldCatsStr);
        const oldAccts = safeMigrateJsonString<BudgetToIdsMap>({})(oldAcctStr);
        return {
          categories: oldCats?.[budgetId] ?? [],
          accounts: oldAccts?.[budgetId] ?? [],
        };
      },
    }
  );
}

export const usePinnedItems = (budgetId: string, sync: boolean) => {
  const pinnedItemsStore = useMemo(
    () => pinnedItemsStorage(budgetId, sync ? "sync" : "local"),
    [sync, budgetId]
  );
  const [pinnedItems, setPinnedItems] = useChromeStorage(pinnedItemsStore);

  const toggleCategory = useCallback(
    async (categoryId: string) => {
      if (!pinnedItems) return;
      const updatedCategories = pinnedItems.categories.includes(categoryId)
        ? pinnedItems.categories.filter((id) => id !== categoryId)
        : [...pinnedItems.categories, categoryId];
      return setPinnedItems({ ...pinnedItems, categories: updatedCategories });
    },
    [pinnedItems, setPinnedItems]
  );
  const toggleAccount = useCallback(
    async (accountId: string) => {
      if (!pinnedItems) return;
      const updatedAccounts = pinnedItems.accounts.includes(accountId)
        ? pinnedItems.accounts.filter((id) => id !== accountId)
        : [...pinnedItems.accounts, accountId];
      return setPinnedItems({ ...pinnedItems, accounts: updatedAccounts });
    },
    [pinnedItems, setPinnedItems]
  );

  const setCategories = useCallback(
    async (categories: string[]) => {
      return setPinnedItems((prev) => ({ ...prev, categories }));
    },
    [setPinnedItems]
  );
  const setAccounts = useCallback(
    async (accounts: string[]) => {
      return setPinnedItems((prev) => ({ ...prev, accounts }));
    },
    [setPinnedItems]
  );

  return {
    pinnedItems,
    toggleCategory,
    toggleAccount,
    setCategories,
    setAccounts,
  };
};
