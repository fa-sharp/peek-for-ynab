import { useCallback, useMemo } from "react";

import { storage } from "#imports";
import { STORAGE_KEYS } from "~lib/constants";
import type { AppSettings } from "~lib/types";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

/** Shape of the pinned items storage for each budget */
interface PinnedItemsStorage {
  /** IDs of the pinned categories */
  categories: string[];
  /** IDs of the pinned accounts */
  accounts: string[];
}

const DEFAULT_PINNED_ITEMS: PinnedItemsStorage = { categories: [], accounts: [] };

/** Old shape of the pinned items storage: map of budget IDs to arrays of account/category IDs */
interface OldBudgetToIdsMap {
  [budgetId: string]: string[] | undefined;
}

export function pinnedItemsStorage(budgetId: string, area: "local" | "sync") {
  return storage.defineItem<PinnedItemsStorage>(
    `${area}:${STORAGE_KEYS.PinnedItems(budgetId)}`,
    {
      fallback: DEFAULT_PINNED_ITEMS,
      init: !budgetId
        ? undefined
        : async () => {
            // on key creation, migrate from old storage of pinned items
            const oldCatsStr = await storage.getItem<string>(`${area}:cats`);
            const oldAcctStr = await storage.getItem<string>(`${area}:accounts`);
            const oldCats = safeMigrateJsonString<OldBudgetToIdsMap>({})(oldCatsStr);
            const oldAccts = safeMigrateJsonString<OldBudgetToIdsMap>({})(oldAcctStr);
            return {
              categories: oldCats?.[budgetId] ?? [],
              accounts: oldAccts?.[budgetId] ?? [],
            };
          },
    }
  );
}

export const usePinnedItems = (
  budgetId: string,
  sync: boolean,
  settings?: AppSettings
) => {
  const pinnedItemsStore = useMemo(
    () => pinnedItemsStorage(budgetId, sync ? "sync" : "local"),
    [sync, budgetId]
  );
  // If user has selected multiple budgets, cache the pinned items from all of them
  // to prevent rendering flashes when switching budgets
  const cachedPinnedItems = useMemo(
    () =>
      settings?.budgets && settings.budgets.length > 1
        ? settings?.budgets?.map((budgetId) =>
            pinnedItemsStorage(budgetId, sync ? "sync" : "local")
          )
        : undefined,
    [settings?.budgets, sync]
  );
  const [pinnedItems, setPinnedItems] = useChromeStorage(pinnedItemsStore, {
    initialValue: DEFAULT_PINNED_ITEMS,
    cacheItems: cachedPinnedItems,
  });

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
      return setPinnedItems((prev) => (prev ? { ...prev, categories } : prev));
    },
    [setPinnedItems]
  );
  const setAccounts = useCallback(
    async (accounts: string[]) => {
      return setPinnedItems((prev) => (prev ? { ...prev, accounts } : prev));
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
