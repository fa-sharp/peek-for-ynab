import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createProvider } from "puro";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as ynab from "ynab";

import {
  checkUnapprovedTxsForBudget,
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget,
  fetchPayeesForBudget
} from "~lib/api";

import { IS_DEV, ONE_DAY_IN_MILLIS } from "../utils";
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
    selectedBudgetId,
    budgetSettings,
    savedAccounts,
    savedCategories,
    shownBudgetIds,
    setSelectedBudgetId,
    setShownBudgetIds
  } = useStorageContext();

  const [ynabAPI, setYnabAPI] = useState<null | ynab.api>(null);
  const queryClient = useQueryClient();

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
    staleTime: ONE_DAY_IN_MILLIS * 7,
    enabled: Boolean(ynabAPI),
    queryFn: async (): Promise<CachedBudget[] | undefined> => {
      if (!ynabAPI) return;
      const budgets = await fetchBudgets(ynabAPI);
      // If no budgets have been selected by the user, select the most recently modified budget
      if (shownBudgetIds && shownBudgetIds.length === 0 && budgets[0]) {
        setShownBudgetIds([budgets[0].id]);
        setSelectedBudgetId(budgets[0].id);
      }
      return budgets;
    }
  });

  /** Data from the currently selected budget */
  const selectedBudgetData = useMemo(
    () => budgetsData?.find((b) => b.id === selectedBudgetId) || null,
    [budgetsData, selectedBudgetId]
  );

  /** Fetch category data from API for the selected budget. Re-runs if the user selects another budget */
  const {
    data: categoryGroupsData,
    dataUpdatedAt: categoriesLastUpdated,
    error: categoriesError,
    refetch: refetchCategoryGroups
  } = useQuery({
    queryKey: ["categoryGroups", { budgetId: selectedBudgetId }],
    enabled: Boolean(ynabAPI && selectedBudgetId),
    queryFn: async ({ queryKey }) => {
      if (!ynabAPI) return;
      return await fetchCategoryGroupsForBudget(
        ynabAPI,
        selectedBudgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.categoryGroups
  });

  /** Flattened array of categories (depends on `categoryGroupsData` above) */
  const categoriesData = useMemo(
    () => categoryGroupsData?.flatMap((categoryGroup) => categoryGroup.categories),
    [categoryGroupsData]
  );

  /** Select data of only saved categories from `categoriesData` */
  const savedCategoriesData = useMemo(() => {
    if (!categoriesData) return null;
    return savedCategories?.[selectedBudgetId]?.reduce<ynab.Category[]>(
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

  /** Fetch accounts for the selected budget */
  const {
    data: accountsData,
    dataUpdatedAt: accountsLastUpdated,
    error: accountsError,
    refetch: refetchAccounts
  } = useQuery({
    queryKey: ["accounts", { budgetId: selectedBudgetId }],
    enabled: Boolean(ynabAPI && selectedBudgetId),
    queryFn: async ({ queryKey }) => {
      if (!ynabAPI) return;
      return await fetchAccountsForBudget(
        ynabAPI,
        selectedBudgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.accounts
  });

  const refreshCategoriesAndAccounts = useCallback(
    () => Promise.all([refetchCategoryGroups(), refetchAccounts()]),
    [refetchAccounts, refetchCategoryGroups]
  );

  /** Check for new/unapproved transactions in selected budget (if user wants notifications) */
  const { data: unapprovedTxs } = useQuery({
    queryKey: ["unapproved", { budgetId: selectedBudgetId }],
    enabled: Boolean(
      ynabAPI && selectedBudgetId && budgetSettings?.notifications.checkImports
    ),
    queryFn: async () => {
      if (!ynabAPI) return;
      return await checkUnapprovedTxsForBudget(ynabAPI, selectedBudgetId);
    }
  });

  /** Fetch payees for the selected budget */
  const { data: payeesData, refetch: refetchPayees } = useQuery({
    queryKey: ["payees", { budgetId: selectedBudgetId }],
    staleTime: ONE_DAY_IN_MILLIS,
    enabled: Boolean(ynabAPI && selectedBudgetId),
    queryFn: async ({ queryKey }) => {
      if (!ynabAPI) return;
      return await fetchPayeesForBudget(
        ynabAPI,
        selectedBudgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.payees
  });

  /** Select data of only saved accounts from `accountsData` */
  const savedAccountsData = useMemo(() => {
    if (!accountsData) return null;
    // For each saved account in the current budget, grab the account data and add to array
    return savedAccounts?.[selectedBudgetId]?.reduce<ynab.Account[]>(
      (newArray, savedAccountId) => {
        const accountData = accountsData.find((a) => a.id === savedAccountId);
        if (accountData) newArray.push(accountData);
        return newArray;
      },
      []
    );
  }, [accountsData, savedAccounts, selectedBudgetId]);

  const useGetAccountsForBudget = (budgetId: string) =>
    useQuery({
      queryKey: ["accounts", { budgetId }],
      enabled: Boolean(ynabAPI),
      queryFn: async ({ queryKey }) => {
        if (!ynabAPI) return;
        return await fetchAccountsForBudget(
          ynabAPI,
          budgetId,
          queryClient.getQueryState(queryKey)
        );
      },
      select: (data) => data?.accounts
    });

  const addTransaction = useCallback(
    async (transaction: ynab.NewTransaction) => {
      if (!ynabAPI || !selectedBudgetId) return;
      const response = await ynabAPI.transactions.createTransaction(selectedBudgetId, {
        transaction
      });
      IS_DEV &&
        console.log("Added transaction!", { transaction, apiResponse: response.data });
      setTimeout(() => {
        refreshCategoriesAndAccounts();
        if (!transaction.payee_id) refetchPayees();
      }, 350);
    },
    [refreshCategoriesAndAccounts, refetchPayees, selectedBudgetId, ynabAPI]
  );

  return {
    /** API data: List of all user's budgets */
    budgetsData,
    /** API data: List of all non-hidden category groups in current budget, with categories contained in each one */
    categoryGroupsData,
    categoriesLastUpdated,
    /** API data: Flattened list of all non-hidden categories (without category groups) in current budget */
    categoriesData,
    /** API data: Error while fetching categories */
    categoriesError,
    /** API data: List of all open accounts in current budget*/
    accountsData,
    accountsLastUpdated,
    /** API data: Error while fetching accounts */
    accountsError,
    /** API data: List of all payees in current budget */
    payeesData,
    /** API data: Unapproved transactions in current budget */
    unapprovedTxs,
    /** API data: Currently selected budget */
    selectedBudgetData,
    /** API data: List of saved accounts in the currently selected budget */
    savedAccountsData,
    /** API data: List of saved categories in the currently selected budget */
    savedCategoriesData,
    /** Fetch user's budgets from API and store/refresh the cache */
    refreshBudgets,
    isRefreshingBudgets,
    refreshCategoriesAndAccounts,
    /** Get accounts for the specified budget */
    useGetAccountsForBudget,
    /** Add a new transaction to the current budget */
    addTransaction
  };
};

const { BaseContext, Provider } = createProvider(useYNABProvider);

/** Hook that provides user's budget data from YNAB */
export const useYNABContext = () => useContext(BaseContext);
export const YNABProvider = Provider;
