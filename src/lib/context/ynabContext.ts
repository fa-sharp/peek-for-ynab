import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createProvider } from "puro";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as ynab from "ynab";

import { IS_PRODUCTION, ONE_DAY_IN_MILLIS, TWO_WEEKS_IN_MILLIS } from "../utils";
import { useAuthContext } from "./authContext";
import { useStorageContext } from "./storageContext";

export interface CachedBudget {
  id: string;
  name: string;
  currencyFormat?: ynab.CurrencyFormat;
}

export interface CachedPayee {
  id: string;
  name: string;
  transferId?: string | null;
}

const useYNABProvider = () => {
  const { tokenExpired } = useAuthContext();
  const {
    tokenData,
    settings,
    selectedBudgetId,
    savedAccounts,
    savedCategories,
    shownBudgetIds,
    setShownBudgetIds
  } = useStorageContext();

  const queryClient = useQueryClient();
  const [ynabAPI, setYnabAPI] = useState<null | ynab.api>(null);

  /** Initialize ynabAPI object if authenticated */
  useEffect(() => {
    if (tokenData && !tokenExpired) setYnabAPI(new ynab.API(tokenData.accessToken));
    else setYnabAPI(null);
  }, [tokenData, tokenExpired]);

  /** Fetch and cache user's budgets. */
  const {
    data: budgetsData,
    refetch: refreshBudgets,
    isFetching: isRefreshingBudgets
  } = useQuery({
    queryKey: ["budgets"],
    staleTime: TWO_WEEKS_IN_MILLIS, // Budgets stay fresh in cache for two weeks
    cacheTime: TWO_WEEKS_IN_MILLIS,
    enabled: Boolean(ynabAPI),
    queryFn: async (): Promise<CachedBudget[] | undefined> => {
      if (!ynabAPI) return;
      const {
        data: { budgets }
      } = await ynabAPI.budgets.getBudgets();
      // Sort budgets by last modified
      budgets.sort((a, b) =>
        a.last_modified_on &&
        b.last_modified_on &&
        new Date(a.last_modified_on).valueOf() < new Date(b.last_modified_on).valueOf()
          ? 1
          : -1
      );
      // Show first two budgets by default
      if (!shownBudgetIds || shownBudgetIds.length === 0)
        setShownBudgetIds(budgets.slice(0, 2).map((b) => b.id));
      return budgets.map((budgetSummary) => ({
        id: budgetSummary.id,
        name: budgetSummary.name,
        currencyFormat: budgetSummary.currency_format || undefined
      }));
    },
    onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched budgets!", data)
  });

  /** Data from the currently selected budget */
  const selectedBudgetData = useMemo(
    () => budgetsData?.find((b) => b.id === selectedBudgetId) || null,
    [budgetsData, selectedBudgetId]
  );

  /** The budgets the user has selected to show */
  const shownBudgetsData = useMemo(
    () => budgetsData?.filter((b) => shownBudgetIds?.includes(b.id)),
    [budgetsData, shownBudgetIds]
  );

  /** Fetch category data from API for the selected budget. Re-runs if the user selects another budget */
  const { data: categoryGroupsData, dataUpdatedAt: categoriesLastUpdated } = useQuery({
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
  const categoriesData = useMemo(
    () => categoryGroupsData?.flatMap((categoryGroup) => categoryGroup.categories),
    [categoryGroupsData]
  );

  /** Select data of only saved categories from `categoriesData` */
  const savedCategoriesData = useMemo(() => {
    if (!categoriesData) return null;
    return savedCategories[selectedBudgetId]?.reduce<ynab.Category[]>(
      (newArray, savedCategoryId) => {
        const categoryData = categoriesData.find(
          (category) => category.id === savedCategoryId
        );
        if (categoryData) newArray.push(categoryData);
        return newArray;
      },
      []
    );
  }, [categoriesData, savedCategories, selectedBudgetId]);

  /** Fetch accounts for the selected budget (if user enables accounts and/or transactions). */
  const { data: accountsData, dataUpdatedAt: accountsLastUpdated } = useQuery({
    queryKey: ["accounts", `budgetId-${selectedBudgetId}`],
    enabled: Boolean(
      (settings.showAccounts || settings.txEnabled) && ynabAPI && selectedBudgetId
    ),
    queryFn: async () => {
      if (!ynabAPI) return;
      const response = await ynabAPI.accounts.getAccounts(selectedBudgetId);
      return response.data.accounts.filter((a) => a.closed === false); // only get open accounts
    },
    onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched accounts!", data)
  });

  const refreshCategoriesAndAccounts = useCallback(() => {
    queryClient.refetchQueries({
      queryKey: ["categoryGroups", `budgetId-${selectedBudgetId}`]
    });
    queryClient.refetchQueries({
      queryKey: ["accounts", `budgetId-${selectedBudgetId}`]
    });
  }, [queryClient, selectedBudgetId]);

  /** Fetch payees for the selected budget (if user enables transactions) */
  const { data: payeesData } = useQuery({
    queryKey: ["payees", `budgetId-${selectedBudgetId}`],
    staleTime: ONE_DAY_IN_MILLIS,
    cacheTime: TWO_WEEKS_IN_MILLIS,
    enabled: Boolean(settings.txEnabled && ynabAPI && selectedBudgetId),
    queryFn: async (): Promise<CachedPayee[] | undefined> => {
      if (!ynabAPI) return;
      const response = await ynabAPI.payees.getPayees(selectedBudgetId);
      return response.data.payees
        .map((payee) => ({
          id: payee.id,
          name: payee.name,
          transferId: payee.transfer_account_id
        }))
        .sort((a, b) => (a.name < b.name ? -1 : 1)); // sort alphabetically
    },
    onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched payees!", data)
  });

  /** Select data of only saved accounts from `accountsData` */
  const savedAccountsData = useMemo(() => {
    if (!accountsData) return null;
    // For each saved account in the current budget, grab the account data and add to array
    return savedAccounts[selectedBudgetId]?.reduce<ynab.Account[]>(
      (newArray, savedAccountId) => {
        const accountData = accountsData.find((a) => a.id === savedAccountId);
        if (accountData) newArray.push(accountData);
        return newArray;
      },
      []
    );
  }, [accountsData, savedAccounts, selectedBudgetId]);

  const useGetAccountTxs = (accountId: string) =>
    useQuery({
      queryKey: ["txs", `budgetId-${selectedBudgetId}`, `accountId-${accountId}`],
      queryFn: async () => {
        if (!ynabAPI) return;
        const response = await ynabAPI.transactions.getTransactionsByAccount(
          selectedBudgetId,
          accountId,
          new Date(Date.now() - 10 * ONE_DAY_IN_MILLIS) // since 10 days ago
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
          new Date(Date.now() - 10 * ONE_DAY_IN_MILLIS) // since 10 days ago
        );
        return response.data.transactions;
      },
      onSuccess: (data) => !IS_PRODUCTION && console.log("Fetched transactions!", data)
    });

  const addTransaction = useCallback(
    async (transaction: ynab.SaveTransaction) => {
      if (!ynabAPI || !selectedBudgetId) return;
      const response = await ynabAPI.transactions.createTransaction(selectedBudgetId, {
        transaction
      });
      !IS_PRODUCTION &&
        console.log("Added transaction!", { transaction, apiResponse: response.data });
      setTimeout(refreshCategoriesAndAccounts, 500);
    },
    [refreshCategoriesAndAccounts, selectedBudgetId, ynabAPI]
  );

  return {
    /** API data: List of all user's budgets */
    budgetsData,
    /** API data: List of all category groups in current budget, with categories contained in each one */
    categoryGroupsData,
    categoriesLastUpdated,
    /** API data: Flattened list of all categories (without category groups) in current budget */
    categoriesData,
    /** API data: List of all open accounts in current budget (if accounts enabled in settings) */
    accountsData,
    accountsLastUpdated,
    /** API data: List of all payees in current budget (if transactions enabled in settings) */
    payeesData,
    /** API data: Currently selected budget */
    selectedBudgetData,
    /** API data: List of budgets the user has selected to show */
    shownBudgetsData,
    /** API data: List of saved accounts in the currently selected budget */
    savedAccountsData,
    /** API data: List of saved categories in the currently selected budget */
    savedCategoriesData,
    /** Fetch user's budgets from API and store/refresh the cache */
    refreshBudgets,
    isRefreshingBudgets,
    refreshCategoriesAndAccounts,
    /** Get recent transactions for the specified account */
    useGetAccountTxs,
    /** Get recent transactions for the specified category */
    useGetCategoryTxs,
    /** Add a new transaction to the current budget */
    addTransaction
  };
};

const { BaseContext, Provider } = createProvider(useYNABProvider);

/** Hook that provides user's budget data from YNAB */
export const useYNABContext = () => useContext(BaseContext);
export const YNABProvider = Provider;
