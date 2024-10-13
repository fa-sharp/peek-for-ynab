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
import { useConfetti } from "~lib/hooks";
import type { BudgetMainData, CachedBudget } from "~lib/types";

import { IS_DEV, ONE_DAY_IN_MILLIS } from "../constants";
import { findAllEmoji, getNDaysAgoISO } from "../utils";
import { useAuthContext } from "./authContext";
import { useStorageContext } from "./storageContext";

const useYNABProvider = () => {
  const { tokenExpired } = useAuthContext();
  const {
    tokenData,
    budgetSettings,
    savedAccounts,
    savedCategories,
    popupState,
    setPopupState,
    shownBudgetIds,
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
        setPopupState({ budgetId: budgets[0].id });
      }
      return budgets;
    }
  });

  /** Data from the currently selected budget */
  const selectedBudgetData = useMemo(
    () => budgetsData?.find((b) => b.id === popupState?.budgetId) || null,
    [budgetsData, popupState?.budgetId]
  );

  /** Fetch category data from API for the selected budget. Re-runs if the user selects another budget */
  const {
    data: categoryGroupsData,
    dataUpdatedAt: categoriesLastUpdated,
    error: categoriesError,
    refetch: refetchCategoryGroups
  } = useQuery({
    queryKey: ["categoryGroups", { budgetId: popupState?.budgetId }],
    enabled: Boolean(ynabAPI && popupState?.budgetId),
    queryFn: async ({ queryKey }) => {
      if (!ynabAPI || !popupState?.budgetId) return;
      return await fetchCategoryGroupsForBudget(
        ynabAPI,
        popupState.budgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.categoryGroups
  });

  const useGetCategoryGroupsForBudget = (budgetId: string) =>
    useQuery({
      queryKey: ["categoryGroups", { budgetId }],
      enabled: Boolean(ynabAPI),
      queryFn: async ({ queryKey }) => {
        if (!ynabAPI) return;
        return await fetchCategoryGroupsForBudget(
          ynabAPI,
          budgetId,
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
    if (!categoriesData || !popupState?.budgetId) return null;
    return savedCategories?.[popupState.budgetId]?.reduce<ynab.Category[]>(
      (newArray, savedCategoryId) => {
        const categoryData = categoriesData.find(
          (category) => category.id === savedCategoryId
        );
        if (categoryData) newArray.push(categoryData);
        return newArray;
      },
      []
    );
  }, [categoriesData, savedCategories, popupState?.budgetId]);

  /** Current month data (Ready to Assign, total activity, etc.) for the selected budget */
  const { data: monthData } = useQuery({
    queryKey: ["month", { budgetId: popupState?.budgetId }],
    enabled: Boolean(ynabAPI && !!popupState?.budgetId && popupState.view === "move"),
    queryFn: async () => {
      if (!ynabAPI || !popupState?.budgetId) return;
      const response = await ynabAPI.months.getBudgetMonth(
        popupState.budgetId,
        "current"
      );
      const { month } = response.data;
      IS_DEV && console.log("Fetched month data!", month);
      return month;
    }
  });

  /** Fetch accounts for the selected budget */
  const {
    data: accountsData,
    dataUpdatedAt: accountsLastUpdated,
    error: accountsError,
    refetch: refetchAccounts
  } = useQuery({
    queryKey: ["accounts", { budgetId: popupState?.budgetId }],
    enabled: Boolean(ynabAPI && popupState?.budgetId),
    queryFn: async ({ queryKey }) => {
      if (!ynabAPI || !popupState?.budgetId) return;
      return await fetchAccountsForBudget(
        ynabAPI,
        popupState.budgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.accounts
  });

  const refreshCategoriesAndAccounts = useCallback(
    () =>
      Promise.all([
        refetchCategoryGroups(),
        refetchAccounts(),
        queryClient.invalidateQueries({
          queryKey: ["month", { budgetId: popupState?.budgetId }]
        })
      ]),
    [queryClient, refetchAccounts, refetchCategoryGroups, popupState?.budgetId]
  );

  /** Check for new/unapproved transactions in selected budget (if user wants notifications) */
  const { data: unapprovedTxs } = useQuery({
    queryKey: ["unapproved", { budgetId: popupState?.budgetId }],
    enabled: Boolean(
      ynabAPI && popupState?.budgetId && budgetSettings?.notifications.checkImports
    ),
    queryFn: async () => {
      if (!ynabAPI || !popupState?.budgetId) return;
      return await checkUnapprovedTxsForBudget(ynabAPI, popupState.budgetId);
    }
  });

  /** Fetch payees for the selected budget */
  const { data: payeesData, refetch: refetchPayees } = useQuery({
    queryKey: ["payees", { budgetId: popupState?.budgetId }],
    staleTime: ONE_DAY_IN_MILLIS,
    enabled: Boolean(ynabAPI && popupState?.budgetId),
    queryFn: async ({ queryKey }) => {
      if (!ynabAPI || !popupState?.budgetId) return;
      return await fetchPayeesForBudget(
        ynabAPI,
        popupState.budgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.payees
  });

  /** Select data of only saved accounts from `accountsData` */
  const savedAccountsData = useMemo(() => {
    if (!accountsData || !popupState?.budgetId) return null;
    // For each saved account in the current budget, grab the account data and add to array
    return savedAccounts?.[popupState.budgetId]?.reduce<ynab.Account[]>(
      (newArray, savedAccountId) => {
        const accountData = accountsData.find((a) => a.id === savedAccountId);
        if (accountData) newArray.push(accountData);
        return newArray;
      },
      []
    );
  }, [accountsData, savedAccounts, popupState?.budgetId]);

  /** Group commonly used data into one object */
  const budgetMainData: BudgetMainData | null = useMemo(() => {
    if (!accountsData || !categoriesData || !categoryGroupsData || !payeesData)
      return null;
    return {
      accountsData,
      categoriesData,
      categoryGroupsData,
      payeesData
    };
  }, [accountsData, categoriesData, categoryGroupsData, payeesData]);

  const useGetAccountTxs = (accountId?: string, sinceDaysAgo?: number) =>
    useQuery({
      enabled: Boolean(ynabAPI && accountId && popupState?.budgetId),
      queryKey: [
        "txs",
        { budgetId: popupState?.budgetId, accountId, sinceDaysAgo }
      ] as const,
      placeholderData: (prevData, prevQuery) => {
        if (prevQuery?.queryKey[1].accountId === accountId && prevData) return prevData;
        return null;
      },
      queryFn: async () => {
        if (!ynabAPI || !accountId || !popupState?.budgetId) return null;
        const response = await ynabAPI.transactions.getTransactionsByAccount(
          popupState?.budgetId,
          accountId,
          sinceDaysAgo
            ? getNDaysAgoISO(sinceDaysAgo)
            : ynab.utils.getCurrentMonthInISOFormat()
        );
        const txs = response.data.transactions.sort((a, b) =>
          a.date <= b.date ? 1 : -1
        );
        IS_DEV && console.log("Fetched account transactions!", txs);
        return txs;
      }
    });

  const useGetCategoryTxs = (categoryId?: string, sinceDaysAgo?: number) =>
    useQuery({
      enabled: Boolean(ynabAPI && categoryId && popupState?.budgetId),
      queryKey: [
        "txs",
        { budgetId: popupState?.budgetId, categoryId, sinceDaysAgo }
      ] as const,
      placeholderData: (prevData, prevQuery) => {
        if (prevQuery?.queryKey[1].categoryId === categoryId && prevData) return prevData;
        return null;
      },
      queryFn: async () => {
        if (!ynabAPI || !categoryId || !popupState?.budgetId) return null;
        const response = await ynabAPI.transactions.getTransactionsByCategory(
          popupState.budgetId,
          categoryId,
          sinceDaysAgo
            ? getNDaysAgoISO(sinceDaysAgo)
            : ynab.utils.getCurrentMonthInISOFormat()
        );
        const txs = response.data.transactions.sort((a, b) =>
          a.date <= b.date ? 1 : -1
        );
        IS_DEV && console.log("Fetched category transactions!", txs);
        return txs;
      }
    });

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

  const { launchConfetti } = useConfetti();

  const [addedTransaction, setAddedTransaction] = useState<ynab.TransactionDetail | null>(
    null
  );

  const addTransaction = useCallback(
    async (transaction: ynab.NewTransaction) => {
      if (!ynabAPI || !popupState?.budgetId) return;
      const response = await ynabAPI.transactions.createTransaction(popupState.budgetId, {
        transaction
      });
      IS_DEV &&
        console.log("Added transaction!", { transaction, apiResponse: response.data });
      setTimeout(() => {
        refreshCategoriesAndAccounts();
        if (!transaction.payee_id) refetchPayees();
      }, 350);

      if (response.data.transaction) {
        const { transaction } = response.data;
        setAddedTransaction(transaction);
        setTimeout(() => setAddedTransaction(null), 4 * 1000);
        if (
          budgetSettings?.confetti?.allCategories ||
          (transaction.category_id &&
            budgetSettings?.confetti?.categories.includes(transaction.category_id))
        ) {
          const emojis = [
            ...budgetSettings.confetti.emojis,
            ...findAllEmoji(transaction.category_name || "")
          ];
          launchConfetti(emojis);
        }
        transaction?.category_id &&
          queryClient.invalidateQueries({
            queryKey: [
              "txs",
              {
                budgetId: popupState.budgetId,
                categoryId: transaction.category_id
              }
            ]
          });
        transaction?.account_id &&
          queryClient.invalidateQueries({
            queryKey: [
              "txs",
              {
                budgetId: popupState.budgetId,
                accountId: transaction.account_id
              }
            ]
          });
        transaction?.transfer_account_id &&
          queryClient.invalidateQueries({
            queryKey: [
              "txs",
              {
                budgetId: popupState.budgetId,
                accountId: transaction.transfer_account_id
              }
            ]
          });
      }
    },
    [
      ynabAPI,
      popupState?.budgetId,
      refreshCategoriesAndAccounts,
      refetchPayees,
      budgetSettings?.confetti?.allCategories,
      budgetSettings?.confetti?.categories,
      budgetSettings?.confetti?.emojis,
      queryClient,
      launchConfetti
    ]
  );

  const moveMoney = useCallback(
    async ({
      subtractFromCategoryId,
      addToCategoryId,
      amountInMillis
    }: {
      subtractFromCategoryId?: string;
      addToCategoryId?: string;
      amountInMillis: number;
    }) => {
      if (!ynabAPI || !popupState?.budgetId) return;
      const fromCategory = categoriesData?.find((c) => c.id === subtractFromCategoryId);
      const toCategory = categoriesData?.find((c) => c.id === addToCategoryId);
      const [subtractResponse, addResponse] = await Promise.all([
        fromCategory
          ? ynabAPI.categories.updateMonthCategory(
              popupState.budgetId,
              "current",
              fromCategory.id,
              { category: { budgeted: fromCategory.budgeted - amountInMillis } }
            )
          : Promise.resolve("No 'from' category"),
        toCategory
          ? ynabAPI.categories.updateMonthCategory(
              popupState.budgetId,
              "current",
              toCategory.id,
              { category: { budgeted: toCategory.budgeted + amountInMillis } }
            )
          : Promise.resolve("No 'to' category")
      ]);
      IS_DEV && console.log("Moved money!", { subtractResponse, addResponse });
      setTimeout(() => refreshCategoriesAndAccounts(), 350);
    },
    [categoriesData, popupState?.budgetId, ynabAPI, refreshCategoriesAndAccounts]
  );

  return {
    /** API data: List of all user's budgets */
    budgetsData,
    /** API data: List of all non-hidden category groups in current budget, with categories contained in each one */
    categoryGroupsData,
    categoriesLastUpdated,
    /** API data: Flattened list of all non-hidden categories (without category groups) in current budget */
    categoriesData,
    /** API data: Current month data, with Ready to Assign, total activity, etc. */
    monthData,
    /** API data: Error while fetching categories */
    categoriesError,
    /** API data: List of all open accounts in current budget*/
    accountsData,
    accountsLastUpdated,
    /** API data: Error while fetching accounts */
    accountsError,
    /** API data: List of all payees in current budget */
    payeesData,
    /** API data: Accounts, category groups, categories, and payees in current budget */
    budgetMainData,
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
    /** Get category data for the specific budget */
    useGetCategoryGroupsForBudget,
    /** Get accounts for the specified budget */
    useGetAccountsForBudget,
    /** Add a new transaction to the current budget */
    addTransaction,
    /** The recently added transaction. Can be used to trigger animations/effects. */
    addedTransaction,
    useGetAccountTxs,
    useGetCategoryTxs,
    /** Move money in the current budget */
    moveMoney
  };
};

const { BaseContext, Provider } = createProvider(useYNABProvider);

/** Hook that provides user's budget data from YNAB */
export const useYNABContext = () => useContext(BaseContext);
export const YNABProvider = Provider;
