import { createProvider } from "puro";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, useQuery } from "react-query";
import * as ynab from "ynab";

import { IS_PRODUCTION } from "../utils";
import { useAuthContext } from "./authContext";
import { CachedBudget, useStorageContext } from "./storageContext";

/** React Query client with options: 30 seconds to stale data, don't refetch on window focus */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30 * 1000, refetchOnWindowFocus: false } }
});

const useYNABProvider = () => {
  const { tokenExpired } = useAuthContext();
  const {
    tokenData,
    settings,
    selectedBudgetId,
    savedAccounts,
    savedCategories,
    cachedBudgets,
    setCachedBudgets
  } = useStorageContext();

  const [ynabAPI, setYnabAPI] = useState<null | ynab.api>(null);

  /** Initialize ynabAPI object if authenticated */
  useEffect(() => {
    if (tokenData && !tokenExpired) setYnabAPI(new ynab.API(tokenData.accessToken));
    else setYnabAPI(null);
  }, [tokenData, tokenExpired]);

  /** Fetch user's budgets and store/refresh the cache. */
  const refreshBudgets = useCallback(async () => {
    if (!ynabAPI) return;
    try {
      const budgetsData = await ynabAPI.budgets.getBudgets();
      if (!IS_PRODUCTION) console.log("Fetched budgets!", budgetsData);
      const newCachedBudgets: CachedBudget[] = budgetsData.data.budgets.map(
        (budgetSummary, index) => ({
          id: budgetSummary.id,
          name: budgetSummary.name,
          currencyFormat: budgetSummary.currency_format || undefined,
          show: !cachedBudgets
            ? index < 5 // if there's no cache (e.g. initial login), show first 5 budgets
            : cachedBudgets.find((b) => b.id === budgetSummary.id)?.show || false // Retain show/hide settings. New budgets are hidden by default
        })
      );
      setCachedBudgets(newCachedBudgets);
    } catch (err) {
      console.error("Error fetching budgets", err);
    }
  }, [cachedBudgets, setCachedBudgets, ynabAPI]);

  /** Automatically fetch budgets from API if logged in and there is no cached budget data */
  useEffect(() => {
    if (ynabAPI && !cachedBudgets) refreshBudgets();
  }, [cachedBudgets, refreshBudgets, ynabAPI]);

  /** Fetch category data from API for the selected budget. Re-runs if the user selects another budget */
  const { data: categoryGroupsData } = useQuery({
    queryKey: ["categoryGroups", `budgetId-${selectedBudgetId}`],
    enabled: Boolean(ynabAPI && selectedBudgetId),
    queryFn: async () => {
      if (!ynabAPI) return;
      const response = await ynabAPI.categories.getCategories(selectedBudgetId);
      return response.data.category_groups;
    },
    onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched categories!", data)
  });

  /** Flattened array of categories (depends on `categoryGroupsData` above) */
  const categoriesData = useMemo(() => {
    if (!categoryGroupsData) return null;
    return categoryGroupsData.reduce<ynab.Category[]>((newArray, categoryGroup) => {
      for (const category of categoryGroup.categories) newArray.push(category);
      return newArray;
    }, []);
  }, [categoryGroupsData]);

  /** Select data of only saved categories from `categoriesData` */
  const savedCategoriesData = useMemo(() => {
    if (!categoriesData) return null;
    return savedCategories.reduce<ynab.Category[]>((newArray, savedCategory) => {
      if (savedCategory.budgetId === selectedBudgetId) {
        const categoryData = categoriesData.find(
          (category) => category.id === savedCategory.categoryId
        );
        if (categoryData) newArray.push(categoryData);
      }
      return newArray;
    }, []);
  }, [categoriesData, savedCategories, selectedBudgetId]);

  /** Fetch accounts for the selected budget (if user has enabled it in settings).
   * Re-runs if the user selects another budget */
  const { data: accountsData } = useQuery({
    queryKey: ["accounts", `budgetId-${selectedBudgetId}`],
    enabled: Boolean(settings.showAccounts && ynabAPI && selectedBudgetId),
    queryFn: async () => {
      if (!ynabAPI) return;
      const response = await ynabAPI.accounts.getAccounts(selectedBudgetId);
      return response.data.accounts.filter((a) => a.closed === false); // only get open accounts
    },
    onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched accounts!", data)
  });

  /** Select data of only saved accounts from `accountsData` */
  const savedAccountsData = useMemo(() => {
    if (!accountsData) return null;
    // For each saved account in the current budget, grab the account data and add to array
    return savedAccounts.reduce<ynab.Account[]>((newArray, savedAccount) => {
      if (savedAccount.budgetId === selectedBudgetId) {
        const categoryData = accountsData.find((a) => a.id === savedAccount.accountId);
        if (categoryData) newArray.push(categoryData);
      }
      return newArray;
    }, []);
  }, [accountsData, savedAccounts, selectedBudgetId]);

  const useGetAccountTxs = (accountId: string) =>
    useQuery({
      queryKey: ["txs", `budgetId-${selectedBudgetId}`, `accountId-${accountId}`],
      queryFn: async () => {
        if (!ynabAPI) return;
        const response = await ynabAPI.transactions.getTransactionsByAccount(
          selectedBudgetId,
          accountId,
          new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // since 10 days ago
        );
        return response.data.transactions;
      },
      onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched transactions!", data)
    });

  const useGetCategoryTxs = (categoryId: string) =>
    useQuery({
      queryKey: ["txs", `budgetId-${selectedBudgetId}`, `categoryId-${categoryId}`],
      queryFn: async () => {
        if (!ynabAPI) return;
        const response = await ynabAPI.transactions.getTransactionsByCategory(
          selectedBudgetId,
          categoryId,
          new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // since 10 days ago
        );
        return response.data.transactions;
      },
      onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched transactions!", data)
    });

  return {
    /** API data: List of all category groups in current budget, with categories contained in each one */
    categoryGroupsData,
    /** API data: Flattened list of all categories (without category groups) in current budget */
    categoriesData,
    /** API data: List of all open accounts in current budget */
    accountsData,
    /** API data: List of saved accounts in the currently selected budget */
    savedAccountsData,
    /** API data: List of saved categories in the currently selected budget */
    savedCategoriesData,
    /** Fetch user's budgets from API and store/refresh the cache */
    refreshBudgets,
    /** Get recent transactions for the specified account */
    useGetAccountTxs,
    /** Get recent transactions for the specified category */
    useGetCategoryTxs
  };
};

const { BaseContext, Provider } = createProvider(useYNABProvider);

/** Hook that provides user's budget data from YNAB */
export const useYNABContext = () => useContext(BaseContext);
export const YNABProvider = Provider;
