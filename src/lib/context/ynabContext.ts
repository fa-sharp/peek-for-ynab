import { useQuery } from "@tanstack/react-query";
import { createProvider } from "puro";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as ynab from "ynab";

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
    savedAccounts,
    savedCategories,
    shownBudgetIds,
    setSelectedBudgetId,
    setShownBudgetIds
  } = useStorageContext();

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
    staleTime: ONE_DAY_IN_MILLIS,
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
      // If no budgets have been selected by the user, select the most recently modified budget
      if (shownBudgetIds && shownBudgetIds.length === 0 && budgets[0]) {
        setShownBudgetIds([budgets[0].id]);
        setSelectedBudgetId(budgets[0].id);
      }
      IS_DEV && console.log("Fetched budgets!", budgets);
      return budgets.map((budgetSummary) => ({
        id: budgetSummary.id,
        name: budgetSummary.name,
        currencyFormat: budgetSummary.currency_format || undefined
      }));
    }
  });

  /** Data from the currently selected budget */
  const selectedBudgetData = useMemo(
    () => budgetsData?.find((b) => b.id === selectedBudgetId) || null,
    [budgetsData, selectedBudgetId]
  );

  /** Data from the budgets the user has selected to show */
  const shownBudgetsData = useMemo(
    () => budgetsData?.filter((b) => shownBudgetIds?.includes(b.id)),
    [budgetsData, shownBudgetIds]
  );

  /** Fetch category data from API for the selected budget. Re-runs if the user selects another budget */
  const {
    data: categoryGroupsData,
    dataUpdatedAt: categoriesLastUpdated,
    refetch: refetchCategoryGroups
  } = useQuery({
    queryKey: ["categoryGroups", { budgetId: selectedBudgetId }],
    enabled: Boolean(ynabAPI && selectedBudgetId),
    queryFn: async () => {
      if (!ynabAPI) return;
      const response = await ynabAPI.categories.getCategories(selectedBudgetId);
      const categoryGroups = response.data.category_groups.filter(
        (group) => !group.hidden // filter out hidden groups
      );
      categoryGroups.forEach(
        // filter out hidden categories
        (group) => (group.categories = group.categories.filter((c) => !c.hidden))
      );
      IS_DEV && console.log("Fetched categories!", categoryGroups);
      return categoryGroups;
    }
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
    refetch: refetchAccounts
  } = useQuery({
    queryKey: ["accounts", { budgetId: selectedBudgetId }],
    enabled: Boolean(ynabAPI && selectedBudgetId),
    queryFn: async () => {
      if (!ynabAPI) return;
      const response = await ynabAPI.accounts.getAccounts(selectedBudgetId);
      const accounts = response.data.accounts
        .filter((a) => a.closed === false) // filter out closed accounts
        .sort((a, b) =>
          a.on_budget && !b.on_budget ? -1 : !a.on_budget && b.on_budget ? 1 : 0
        ); // sort with Budget accounts first
      IS_DEV && console.log("Fetched accounts!", accounts);
      return accounts;
    }
  });

  const refreshCategoriesAndAccounts = useCallback(
    () => Promise.all([refetchCategoryGroups(), refetchAccounts()]),
    [refetchAccounts, refetchCategoryGroups]
  );

  /** Fetch payees for the selected budget */
  const { data: payeesData } = useQuery({
    queryKey: ["payees", { budgetId: selectedBudgetId }],
    staleTime: ONE_DAY_IN_MILLIS,
    enabled: Boolean(ynabAPI && selectedBudgetId),
    queryFn: async (): Promise<CachedPayee[] | undefined> => {
      if (!ynabAPI) return;
      const response = await ynabAPI.payees.getPayees(selectedBudgetId);
      const payees = response.data.payees
        .map((payee) => ({
          id: payee.id,
          name: payee.name,
          ...(payee.transfer_account_id ? { transferId: payee.transfer_account_id } : {})
        }))
        .sort((a, b) => (a.name < b.name ? -1 : 1)); // sort alphabetically
      IS_DEV && console.log("Fetched payees!", payees);
      return payees;
    }
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

  const useGetAccountTxs = (accountId: string) =>
    useQuery({
      queryKey: ["txs", { budgetId: selectedBudgetId }, `accountId-${accountId}`],
      queryFn: async () => {
        if (!ynabAPI) return;
        const {
          data: { transactions }
        } = await ynabAPI.transactions.getTransactionsByAccount(
          selectedBudgetId,
          accountId,
          new Date(Date.now() - 10 * ONE_DAY_IN_MILLIS).toISOString() // since 10 days ago
        );
        IS_DEV && console.log("Fetched transactions!", transactions);
        return transactions;
      }
    });

  const useGetCategoryTxs = (categoryId: string) =>
    useQuery({
      queryKey: ["txs", { budgetId: selectedBudgetId }, `categoryId-${categoryId}`],
      queryFn: async () => {
        if (!ynabAPI) return;
        const {
          data: { transactions }
        } = await ynabAPI.transactions.getTransactionsByCategory(
          selectedBudgetId,
          categoryId,
          new Date(Date.now() - 10 * ONE_DAY_IN_MILLIS).toISOString() // since 10 days ago
        );
        IS_DEV && console.log("Fetched transactions!", transactions);
        return transactions;
      }
    });

  const addTransaction = useCallback(
    async (transaction: ynab.SaveTransaction) => {
      if (!ynabAPI || !selectedBudgetId) return;
      const response = await ynabAPI.transactions.createTransaction(selectedBudgetId, {
        transaction
      });
      IS_DEV &&
        console.log("Added transaction!", { transaction, apiResponse: response.data });
      setTimeout(() => refreshCategoriesAndAccounts(), 350);
    },
    [refreshCategoriesAndAccounts, selectedBudgetId, ynabAPI]
  );

  return {
    /** API data: List of all user's budgets */
    budgetsData,
    /** API data: List of all non-hidden category groups in current budget, with categories contained in each one */
    categoryGroupsData,
    categoriesLastUpdated,
    /** API data: Flattened list of all non-hidden categories (without category groups) in current budget */
    categoriesData,
    /** API data: List of all open accounts in current budget*/
    accountsData,
    accountsLastUpdated,
    /** API data: List of all payees in current budget */
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
