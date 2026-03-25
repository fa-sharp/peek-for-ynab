import type { UseQueryOptions } from "@tanstack/react-query";

import { IS_DEV, ONE_DAY_IN_MILLIS } from "~lib/constants";
import type { CachedBudget } from "~lib/types";
import { apiClient } from "./client";

export const budgetQuery = {
  queryKey: ["budgets"],
  staleTime: ONE_DAY_IN_MILLIS * 7,
} satisfies UseQueryOptions;

/** Fetch budgets from the YNAB API */
export async function fetchBudgets(token: string): Promise<CachedBudget[]> {
  const { data, error } = await apiClient(token).GET("/plans");
  if (error) throw error;
  const { plans } = data.data;

  // Sort budgets by last modified
  plans.sort((a, b) =>
    a.last_modified_on &&
    b.last_modified_on &&
    new Date(a.last_modified_on).valueOf() < new Date(b.last_modified_on).valueOf()
      ? 1
      : -1
  );
  IS_DEV && console.log("Fetched budgets!", plans);

  return plans.map((budgetSummary) => ({
    id: budgetSummary.id,
    name: budgetSummary.name,
    currencyFormat: budgetSummary.currency_format || undefined,
  }));
}
