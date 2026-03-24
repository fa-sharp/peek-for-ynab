import type { UseQueryOptions } from "@tanstack/react-query";

import { IS_DEV } from "~lib/constants";
import {
  apiClient,
  type HybridTransaction,
  type NewTransaction,
  type Transaction,
  type TransactionDetail,
} from "./client";

export const unapprovedTxsQuery = (budgetId: string) => ({
  queryKey: ["unapproved", { budgetId }],
});

export const accountTxsQuery = (
  budgetId: string,
  accountId?: string,
  sinceDaysAgo?: number
) =>
  ({
    queryKey: ["txs", { budgetId: budgetId, accountId, sinceDaysAgo }],
    placeholderData: (prevData, prevQuery) => {
      if (prevQuery?.queryKey[1].accountId === accountId && prevData) return prevData; // avoid flashes
      return null;
    },
  }) satisfies UseQueryOptions<
    TransactionDetail[] | null,
    unknown,
    unknown,
    ["txs", { budgetId: string; accountId?: string; sinceDaysAgo?: number }]
  >;

export const categoryTxsQuery = (
  budgetId: string,
  categoryId?: string,
  sinceDaysAgo?: number
) =>
  ({
    queryKey: ["txs", { budgetId: budgetId, categoryId, sinceDaysAgo }],
    placeholderData: (prevData, prevQuery) => {
      if (prevQuery?.queryKey[1].categoryId === categoryId && prevData) return prevData; // avoid flashes
      return null;
    },
  }) satisfies UseQueryOptions<
    HybridTransaction[] | null,
    unknown,
    unknown,
    ["txs", { budgetId: string; categoryId?: string; sinceDaysAgo?: number }]
  >;

export async function fetchUnapprovedTxsForBudget(token: string, budgetId: string) {
  const { data, error } = await apiClient(token).GET("/plans/{plan_id}/transactions", {
    params: {
      path: { plan_id: budgetId },
      query: {
        since_date: getNDaysAgoISO(14), // fetch unapproved transactions from up to 2 weeks ago
        type: "unapproved",
      },
    },
  });
  if (error) throw error;

  IS_DEV && console.log("Checked for new imports!", data.data.transactions);
  return data.data.transactions;
}

export async function fetchTransactionsForAccount(
  token: string,
  budgetId: string,
  accountId: string,
  sinceDaysAgo?: number
): Promise<TransactionDetail[] | null> {
  const { data, error } = await apiClient(token).GET(
    "/plans/{plan_id}/accounts/{account_id}/transactions",
    {
      params: {
        path: { plan_id: budgetId, account_id: accountId },
        query: {
          since_date: getNDaysAgoISO(sinceDaysAgo ?? 30),
        },
      },
    }
  );
  if (error) throw error;

  data.data.transactions.sort((a, b) => (a.date <= b.date ? 1 : -1));
  IS_DEV && console.log("Fetched account transactions!", data.data.transactions);
  return data.data.transactions;
}

export async function fetchTransactionsForCategory(
  token: string,
  budgetId: string,
  categoryId: string,
  sinceDaysAgo?: number
): Promise<HybridTransaction[] | null> {
  const { data, error } = await apiClient(token).GET(
    "/plans/{plan_id}/categories/{category_id}/transactions",
    {
      params: {
        path: { plan_id: budgetId, category_id: categoryId },
        query: {
          since_date: getNDaysAgoISO(sinceDaysAgo ?? 30),
        },
      },
    }
  );
  if (error) throw error;

  data.data.transactions.sort((a, b) => (a.date <= b.date ? 1 : -1));
  IS_DEV && console.log("Fetched category transactions!", data.data.transactions);
  return data.data.transactions;
}

export async function createTransaction(
  token: string,
  budgetId: string,
  tx: NewTransaction
) {
  const { data, error } = await apiClient(token).POST("/plans/{plan_id}/transactions", {
    params: {
      path: { plan_id: budgetId },
    },
    body: { transaction: tx },
  });
  if (error) throw error;
  return data.data.transaction as TransactionDetail;
}

function getNDaysAgoISO(days: number) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().substring(0, 10);
}
