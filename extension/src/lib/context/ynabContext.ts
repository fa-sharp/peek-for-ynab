import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  accountsQuery,
  accountTxsQuery,
  budgetQuery,
  categoryGroupsQuery,
  categoryTxsQuery,
  createTransaction,
  currentMonthQuery,
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget,
  fetchCurrentMonthForBudget,
  fetchPayeesForBudget,
  fetchTransactionsForAccount,
  fetchTransactionsForCategory,
  fetchUnapprovedTxsForBudget,
  moveMoneyInBudget,
  payeesQuery,
  unapprovedTxsQuery,
} from "~lib/api";
import type {
  Account,
  Category,
  HybridTransaction,
  NewTransaction,
  TransactionDetail,
} from "~lib/api/client";
import { updateTransaction } from "~lib/api/transactions";
import { IS_DEV } from "~lib/constants";
import { useConfetti } from "~lib/hooks";
import { queryPersister } from "~lib/queryClient";
import type { BudgetMainData } from "~lib/types";
import { findAllEmoji } from "~lib/utils";
import { useAuthContext, useStorageContext } from ".";

export const useYNABProvider = () => {
  const {
    settings,
    budgetSettings,
    pinnedItems,
    toggleShowBudget,
    popupState,
    setPopupState,
  } = useStorageContext();
  const { accessToken } = useAuthContext();

  const queryClient = useQueryClient();

  // Restore all query cache on load
  useEffect(() => {
    queryPersister.restoreQueries(queryClient);
  }, [queryClient]);

  /** Fetch and cache user's budgets. */
  const {
    data: budgetsData,
    refetch: refreshBudgets,
    isFetching: isRefreshingBudgets,
  } = useQuery({
    ...budgetQuery,
    enabled: !!accessToken,
    queryFn: () => (!accessToken ? null : fetchBudgets(accessToken)),
  });

  // If no budgets have been selected by the user, auto-select the most recently modified budget
  useEffect(() => {
    if (!settings.budgets && budgetsData?.[0]) {
      toggleShowBudget(budgetsData[0].id).then(() =>
        setPopupState({ view: "main", budgetId: budgetsData[0].id })
      );
    }
  }, [settings.budgets, budgetsData, toggleShowBudget, setPopupState]);

  /** Data from the currently selected budget */
  const selectedBudgetData = useMemo(
    () => budgetsData?.find((b) => b.id === popupState.budgetId) || null,
    [budgetsData, popupState.budgetId]
  );

  /** Fetch category data from API for the selected budget. Re-runs if the user selects another budget */
  const {
    data: categoryGroupsData,
    dataUpdatedAt: categoriesLastUpdated,
    error: categoriesError,
    refetch: refetchCategoryGroups,
  } = useQuery({
    ...categoryGroupsQuery(popupState.budgetId),
    enabled: Boolean(accessToken && popupState.budgetId),
    queryFn: async ({ queryKey }) => {
      if (!accessToken || !popupState.budgetId) return null;
      return await fetchCategoryGroupsForBudget(
        accessToken,
        popupState.budgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.categoryGroups,
  });

  const useGetCategoryGroupsForBudget = (budgetId: string) =>
    useQuery({
      ...categoryGroupsQuery(budgetId),
      enabled: Boolean(accessToken),
      queryFn: async ({ queryKey }) => {
        if (!accessToken) return null;
        return await fetchCategoryGroupsForBudget(
          accessToken,
          budgetId,
          queryClient.getQueryState(queryKey)
        );
      },
      select: (data) => data?.categoryGroups,
    });

  /** Flattened array of categories (depends on `categoryGroupsData` above) */
  const categoriesData = useMemo(
    () => categoryGroupsData?.flatMap((categoryGroup) => categoryGroup.categories),
    [categoryGroupsData]
  );

  /** Select data of only saved categories from `categoriesData` */
  const savedCategoriesData = useMemo(() => {
    if (!categoriesData || !popupState.budgetId) return null;
    return pinnedItems?.categories.reduce<Category[]>((newArray, savedCategoryId) => {
      const categoryData = categoriesData.find(
        (category) => category.id === savedCategoryId
      );
      if (categoryData) newArray.push(categoryData);
      return newArray;
    }, []);
  }, [categoriesData, pinnedItems?.categories, popupState.budgetId]);

  /** Current month data (Ready to Assign, total activity, etc.) for the selected budget */
  const { data: monthData } = useQuery({
    ...currentMonthQuery(popupState.budgetId),
    enabled: Boolean(accessToken && !!popupState.budgetId && popupState.view === "move"),
    queryFn: async () => {
      if (!accessToken || !popupState.budgetId) return null;
      const month = await fetchCurrentMonthForBudget(accessToken, popupState.budgetId);
      return month;
    },
  });

  /** Fetch accounts for the selected budget */
  const {
    data: accountsData,
    dataUpdatedAt: accountsLastUpdated,
    error: accountsError,
    refetch: refetchAccounts,
  } = useQuery({
    ...accountsQuery(popupState.budgetId),
    enabled: Boolean(accessToken && popupState.budgetId),
    queryFn: async ({ queryKey }) => {
      if (!accessToken || !popupState.budgetId) return null;
      return await fetchAccountsForBudget(
        accessToken,
        popupState.budgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.accounts,
  });

  const refetchCategoriesAndAccounts = useCallback(
    () =>
      Promise.all([
        refetchCategoryGroups(),
        refetchAccounts(),
        queryClient.invalidateQueries({
          queryKey: currentMonthQuery(popupState.budgetId).queryKey,
        }),
      ]),
    [queryClient, refetchAccounts, refetchCategoryGroups, popupState.budgetId]
  );

  /** Check for new/unapproved transactions in selected budget, if user wants notifications */
  const { data: unapprovedTxs } = useQuery({
    ...unapprovedTxsQuery(popupState.budgetId),
    enabled: Boolean(
      accessToken && popupState.budgetId && budgetSettings?.notifications.checkImports
    ),
    queryFn: async () => {
      if (!accessToken || !popupState.budgetId) return null;
      return await fetchUnapprovedTxsForBudget(accessToken, popupState.budgetId);
    },
  });

  /** Fetch payees for the selected budget */
  const { data: payeesData, refetch: refetchPayees } = useQuery({
    ...payeesQuery(popupState.budgetId),
    enabled: Boolean(accessToken && popupState.budgetId),
    queryFn: async ({ queryKey }) => {
      if (!accessToken || !popupState.budgetId) return null;
      return await fetchPayeesForBudget(
        accessToken,
        popupState.budgetId,
        queryClient.getQueryState(queryKey)
      );
    },
    select: (data) => data?.payees,
  });

  /** Select data of only saved accounts from `accountsData` */
  const savedAccountsData = useMemo(() => {
    if (!accountsData || !popupState.budgetId) return null;
    // For each saved account in the current budget, grab the account data and add to array
    return pinnedItems?.accounts?.reduce<Account[]>((newArray, savedAccountId) => {
      const accountData = accountsData.find((a) => a.id === savedAccountId);
      if (accountData) newArray.push(accountData);
      return newArray;
    }, []);
  }, [accountsData, pinnedItems?.accounts, popupState.budgetId]);

  /** Group commonly used data into one object */
  const budgetMainData: BudgetMainData | null = useMemo(() => {
    if (!accountsData || !categoriesData || !categoryGroupsData || !payeesData)
      return null;
    return {
      accountsData,
      categoriesData,
      categoryGroupsData,
      payeesData,
      currencyFormat: selectedBudgetData?.currencyFormat,
    };
  }, [accountsData, categoriesData, categoryGroupsData, payeesData, selectedBudgetData]);

  const useGetAccountTxs = (accountId?: string, sinceDaysAgo?: number) =>
    useQuery({
      ...accountTxsQuery(popupState.budgetId, accountId, sinceDaysAgo),
      enabled: Boolean(accessToken && accountId && popupState.budgetId),
      queryFn: async () => {
        if (!accessToken || !accountId || !popupState.budgetId) return null;
        return fetchTransactionsForAccount(
          accessToken,
          popupState.budgetId,
          accountId,
          sinceDaysAgo
        );
      },
    });

  const useGetCategoryTxs = (categoryId?: string, sinceDaysAgo?: number) =>
    useQuery({
      ...categoryTxsQuery(popupState.budgetId, categoryId, sinceDaysAgo),
      enabled: Boolean(accessToken && categoryId && popupState.budgetId),
      queryFn: async () => {
        if (!accessToken || !categoryId || !popupState.budgetId) return null;
        return await fetchTransactionsForCategory(
          accessToken,
          popupState.budgetId,
          categoryId,
          sinceDaysAgo
        );
      },
    });

  const refetchTransaction = useCallback(
    (transaction: TransactionDetail) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: unapprovedTxsQuery(popupState.budgetId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: accountTxsQuery(popupState.budgetId, transaction.account_id).queryKey,
        }),
        transaction.category_id &&
          queryClient.invalidateQueries({
            queryKey: categoryTxsQuery(popupState.budgetId, transaction.category_id)
              .queryKey,
          }),
        transaction.transfer_account_id &&
          queryClient.invalidateQueries({
            queryKey: accountTxsQuery(
              popupState.budgetId,
              transaction.transfer_account_id
            ).queryKey,
          }),
      ]);
    },
    [queryClient, popupState.budgetId]
  );

  const useGetAccountsForBudget = (budgetId: string) =>
    useQuery({
      ...accountsQuery(budgetId),
      enabled: Boolean(accessToken),
      queryFn: async ({ queryKey }) => {
        if (!accessToken) return null;
        return await fetchAccountsForBudget(
          accessToken,
          budgetId,
          queryClient.getQueryState(queryKey)
        );
      },
      select: (data) => data?.accounts,
    });

  const { launchConfetti } = useConfetti();

  const [addedTransaction, setAddedTransaction] = useState<TransactionDetail | null>(
    null
  );

  const addTransaction = useCallback(
    async (tx: NewTransaction) => {
      if (!accessToken || !popupState.budgetId) return;
      const transaction = await createTransaction(accessToken, popupState.budgetId, tx);

      setTimeout(() => {
        refetchCategoriesAndAccounts();
        if (!tx.payee_id) refetchPayees();
        refetchTransaction(transaction);
      }, 350);

      setAddedTransaction(transaction);
      setTimeout(() => setAddedTransaction(null), 4 * 1000);

      if (
        budgetSettings?.confetti?.allCategories ||
        (transaction.category_id &&
          budgetSettings?.confetti?.categories.includes(transaction.category_id))
      ) {
        const emojis = [
          ...budgetSettings.confetti.emojis,
          ...findAllEmoji(transaction.category_name || ""),
        ];
        launchConfetti(emojis);
      }
    },
    [
      accessToken,
      popupState.budgetId,
      refetchCategoriesAndAccounts,
      refetchTransaction,
      refetchPayees,
      budgetSettings?.confetti,
      launchConfetti,
    ]
  );

  const approveTransaction = useCallback(
    async (transaction: TransactionDetail | HybridTransaction) => {
      if (!accessToken || !popupState.budgetId) return;
      const updatedTx = await updateTransaction(
        accessToken,
        popupState.budgetId,
        transaction.id,
        { approved: true }
      );
      await refetchTransaction(updatedTx);
    },
    [accessToken, popupState.budgetId, refetchTransaction]
  );

  const [moved, setMoved] = useState<{ from?: Category; to?: Category } | null>(null);

  const moveMoney = useCallback(
    async ({
      subtractFromCategoryId,
      addToCategoryId,
      amountInMillis,
    }: {
      subtractFromCategoryId?: string;
      addToCategoryId?: string;
      amountInMillis: number;
    }) => {
      if (!accessToken || !popupState.budgetId) return;
      const fromCategory = categoriesData?.find((c) => c.id === subtractFromCategoryId);
      const toCategory = categoriesData?.find((c) => c.id === addToCategoryId);
      const [subtractResponse, addResponse] = await moveMoneyInBudget(
        accessToken,
        popupState.budgetId,
        amountInMillis,
        fromCategory,
        toCategory
      );
      IS_DEV && console.log("Moved money!", { subtractResponse, addResponse });
      setTimeout(() => refetchCategoriesAndAccounts(), 350);

      setMoved({ from: fromCategory, to: toCategory });
      setTimeout(() => setMoved(null), 4 * 1000);
    },
    [accessToken, popupState.budgetId, categoriesData, refetchCategoriesAndAccounts]
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
    refetchCategoriesAndAccounts,
    /** Get category data for the specific budget */
    useGetCategoryGroupsForBudget,
    /** Get accounts for the specified budget */
    useGetAccountsForBudget,
    /** Add a new transaction to the current budget */
    addTransaction,
    /** Approve a transaction in the current budget */
    approveTransaction,
    /** The recently added transaction. Can be used to trigger animations/effects. */
    addedTransaction,
    useGetAccountTxs,
    useGetCategoryTxs,
    /** Move money in the current budget */
    moveMoney,
    /** The recently moved category/categories. Can be used to trigger animations/effects. */
    moved,
  };
};

export const YNABContext =
  //@ts-expect-error Context should not be null if wrapped in provider
  createContext<ReturnType<typeof useYNABProvider>>(null);

/** Hook that provides user's budget data from YNAB */
export const useYNABContext = () => useContext(YNABContext);
