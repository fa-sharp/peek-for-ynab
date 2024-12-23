import { type Account, type Category, type TransactionDetail, api } from "ynab";

import {
  checkUnapprovedTxsForBudget,
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget
} from "~lib/api";
import {
  CHROME_LOCAL_STORAGE,
  CHROME_SESSION_STORAGE,
  CHROME_SYNC_STORAGE,
  IS_DEV,
  ONE_DAY_IN_MILLIS,
  REFRESH_SIGNAL_KEY,
  TOKEN_STORAGE,
  TOKEN_STORAGE_KEY
} from "~lib/constants";
import {
  type CurrentAlerts,
  createSystemNotification,
  getBudgetAlerts,
  updateIconAndTooltip
} from "~lib/notifications";
import { createQueryClient } from "~lib/queryClient";
import type { BudgetSettings, TokenData } from "~lib/types";
import { checkPermissions, isEmptyObject } from "~lib/utils";

export const IS_TOKEN_REFRESHING_KEY = "isRefreshing";

export async function refreshToken(): Promise<TokenData | null> {
  await CHROME_SESSION_STORAGE.set(IS_TOKEN_REFRESHING_KEY, true);

  // check if token exists
  const tokenData = await TOKEN_STORAGE.get<TokenData | null>(TOKEN_STORAGE_KEY);
  if (!tokenData) {
    console.error("Not refreshing - no existing token data found");
    await TOKEN_STORAGE.set(REFRESH_SIGNAL_KEY, false);
    await CHROME_SESSION_STORAGE.set(IS_TOKEN_REFRESHING_KEY, false);
    return null;
  }

  // refresh token
  let newTokenData: TokenData | null = null;
  const refreshUrl = `${process.env.PLASMO_PUBLIC_MAIN_URL || ""}/api/auth/refresh`;
  IS_DEV && console.log("Refreshing token!");

  try {
    const res = await fetch(`${refreshUrl}?refreshToken=${tokenData.refreshToken}`, {
      method: "POST"
    });
    if (!res.ok) {
      if (res.status === 401) await TOKEN_STORAGE.set(TOKEN_STORAGE_KEY, null); // clear token if status is unauthorized
      throw {
        message: "Error from API while refreshing token",
        status: res.status,
        error: await res.text()
      };
    }
    newTokenData = await res.json();
    IS_DEV && console.log("Got a new token!");
    await TOKEN_STORAGE.set(TOKEN_STORAGE_KEY, newTokenData);
  } catch (err) {
    console.error("Failed to refresh token:", err);
  }

  // signal that refresh is complete
  try {
    await TOKEN_STORAGE.set(REFRESH_SIGNAL_KEY, false);
    await CHROME_SESSION_STORAGE.set(IS_TOKEN_REFRESHING_KEY, false);
  } catch (err) {
    console.error("Failed to signal refresh completion:", err);
  }

  return newTokenData;
}

export async function backgroundDataRefresh() {
  IS_DEV && console.log("Background refresh: Starting...");
  // Check for existing token. If it's expired, refresh the token
  let tokenData = await TOKEN_STORAGE.get<TokenData | null>(TOKEN_STORAGE_KEY);
  if (!tokenData) {
    IS_DEV && console.log("Background refresh: no existing token data found");
    return;
  }
  if (tokenData.expires < Date.now() + 60 * 1000) {
    IS_DEV && console.log("Background refresh: Refreshing token...");
    tokenData = await refreshToken();
    if (!tokenData) {
      console.error("Background refresh: couldn't get new token");
      return;
    }
  }

  const syncEnabled = await CHROME_LOCAL_STORAGE.get<boolean>("sync");
  const storage = syncEnabled ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE;
  const shownBudgetIds = await storage.get<string[]>("budgets");
  if (!shownBudgetIds) return;

  IS_DEV && console.log("Background refresh: updating alerts...");
  const ynabAPI = new api(tokenData.accessToken);
  const queryClient = createQueryClient({
    staleTime: 10 * 60 * 1000 // to prevent too many refetches, data is assumed fresh for 10 minutes
  });
  const budgetsData = await queryClient.fetchQuery({
    queryKey: ["budgets"],
    staleTime: ONE_DAY_IN_MILLIS * 7,
    queryFn: () => fetchBudgets(ynabAPI)
  });

  const alerts: CurrentAlerts = {};
  const oldAlerts = await CHROME_LOCAL_STORAGE.get<CurrentAlerts>("currentAlerts");
  const notificationsEnabled = await checkPermissions(["notifications"]);

  // Fetch new data for each budget and update alerts
  // FIXME Two `fetchQuery` calls and setTimeout needed because of React Query persister issues in non-React context
  // See https://github.com/TanStack/query/issues/8075
  for (const budget of budgetsData.filter(({ id }) => shownBudgetIds.includes(id))) {
    const budgetSettings = await storage.get<BudgetSettings>(`budget-${budget.id}`);
    if (!budgetSettings) continue;

    let unapprovedTxs: TransactionDetail[] | undefined;
    let accountsData: Account[] | undefined;
    let categoriesData: Category[] | undefined;

    if (budgetSettings.notifications.checkImports) {
      // call import API, then check for unapproved transactions
      const queryKey = ["import", { budgetId: budget.id }];
      await queryClient.fetchQuery({
        queryKey,
        queryFn: async () =>
          (await ynabAPI.transactions.importTransactions(budget.id)).data.transaction_ids
      });
      await new Promise((r) => setTimeout(r, 100));
      await queryClient.fetchQuery({
        queryKey,
        staleTime: 50 * 60 * 1000, // 50 minutes
        queryFn: async () =>
          (await ynabAPI.transactions.importTransactions(budget.id)).data.transaction_ids
      });
      unapprovedTxs = await checkUnapprovedTxsForBudget(ynabAPI, budget.id);
    }

    if (
      budgetSettings.notifications.importError ||
      !isEmptyObject(budgetSettings.notifications.reconcileAlerts)
    ) {
      const queryKey = ["accounts", { budgetId: budget.id }];
      await queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          fetchAccountsForBudget(ynabAPI, budget.id, queryClient.getQueryState(queryKey))
      });
      await new Promise((r) => setTimeout(r, 100));
      const { accounts } = await queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          fetchAccountsForBudget(ynabAPI, budget.id, queryClient.getQueryState(queryKey))
      });
      accountsData = accounts;
    }

    if (budgetSettings.notifications.overspent) {
      const queryKey = ["categoryGroups", { budgetId: budget.id }];
      await queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          fetchCategoryGroupsForBudget(
            ynabAPI,
            budget.id,
            queryClient.getQueryState(queryKey)
          )
      });
      await new Promise((r) => setTimeout(r, 100));
      const { categoryGroups } = await queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          fetchCategoryGroupsForBudget(
            ynabAPI,
            budget.id,
            queryClient.getQueryState(queryKey)
          )
      });
      categoriesData = categoryGroups.flatMap((cg) => cg.categories);
    }

    const budgetAlerts = getBudgetAlerts(budgetSettings.notifications, {
      accounts: accountsData,
      categories: categoriesData,
      unapprovedTxs
    });
    if (budgetAlerts) {
      alerts[budget.id] = budgetAlerts;
      if (
        notificationsEnabled &&
        JSON.stringify(budgetAlerts) !== JSON.stringify(oldAlerts?.[budget.id])
      ) {
        createSystemNotification(budgetAlerts, budget);
      }
    }
  }

  updateIconAndTooltip(alerts, budgetsData);
  await CHROME_LOCAL_STORAGE.set("currentAlerts", alerts);
}
