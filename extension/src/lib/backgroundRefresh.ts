import { type Account, api, type Category, type TransactionDetail } from "ynab";

import {
  checkUnapprovedTxsForBudget,
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget,
} from "~lib/api";
import { IS_DEV, ONE_DAY_IN_MILLIS } from "~lib/constants";
import {
  type CurrentAlerts,
  createSystemNotification,
  getBudgetAlerts,
  updateIconAndTooltip,
} from "~lib/notifications";
import { createQueryClient, tokenPersister } from "~lib/queryClient";
import { checkPermissions, isEmptyObject } from "~lib/utils";
import { fetchAccessToken } from "./api";
import {
  appSettingsStorage,
  authTokenStorage,
  budgetSettingsStorage,
  currentAlertsStorage,
  shouldSyncStorage,
} from "./state";

export async function backgroundDataRefresh() {
  IS_DEV && console.log("Background refresh: Starting...");

  // Create a query client with a longer default stale time to prevent too many refetches
  const queryClient = createQueryClient({
    staleTime: 10 * 60 * 1000,
  });
  // Restore query cache
  await tokenPersister.restoreQueries(queryClient);

  // Fetch the current access token, and store the new authToken if available
  const tokenData = await queryClient.fetchQuery({
    queryKey: ["auth"],
    persister: tokenPersister.persisterFn,
    queryFn: async () => {
      const authToken = await authTokenStorage.getValue();
      if (!authToken) return null;
      const { data, error } = await fetchAccessToken(authToken);
      if (!data) throw new Error(`Failed to get access token: ${error}`);
      return data;
    },
  });
  if (!tokenData) {
    IS_DEV && console.log("Background refresh: no token");
    return;
  } else if (tokenData.authToken) {
    await authTokenStorage.setValue(tokenData.authToken);
  }

  const syncEnabled = await shouldSyncStorage.getValue();
  const storageArea = syncEnabled ? "sync" : "local";
  const { budgets: budgetIds } = await appSettingsStorage(storageArea).getValue();
  if (!budgetIds || budgetIds.length === 0) return;

  IS_DEV && console.log("Background refresh: updating alerts...");
  const ynabAPI = new api(tokenData.accessToken);
  const budgetsData = await queryClient.fetchQuery({
    queryKey: ["budgets"],
    staleTime: ONE_DAY_IN_MILLIS * 7,
    queryFn: () => fetchBudgets(ynabAPI),
  });

  const alerts: CurrentAlerts = {};
  const oldAlerts = await currentAlertsStorage.getValue();
  const notificationsEnabled = await checkPermissions(["notifications"]);

  // Fetch new data for each budget and update alerts
  // FIXME Two `fetchQuery` calls and setTimeout needed because of React Query persister issues in non-React context
  // See https://github.com/TanStack/query/issues/8075
  for (const budget of budgetsData.filter(({ id }) => budgetIds.includes(id))) {
    const budgetSettings = await budgetSettingsStorage(budget.id, storageArea).getValue();
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
          (await ynabAPI.transactions.importTransactions(budget.id)).data.transaction_ids,
      });
      await new Promise((r) => setTimeout(r, 100));
      await queryClient.fetchQuery({
        queryKey,
        staleTime: 50 * 60 * 1000, // 50 minutes
        queryFn: async () =>
          (await ynabAPI.transactions.importTransactions(budget.id)).data.transaction_ids,
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
          fetchAccountsForBudget(ynabAPI, budget.id, queryClient.getQueryState(queryKey)),
      });
      await new Promise((r) => setTimeout(r, 100));
      const { accounts } = await queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          fetchAccountsForBudget(ynabAPI, budget.id, queryClient.getQueryState(queryKey)),
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
          ),
      });
      await new Promise((r) => setTimeout(r, 100));
      const { categoryGroups } = await queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          fetchCategoryGroupsForBudget(
            ynabAPI,
            budget.id,
            queryClient.getQueryState(queryKey)
          ),
      });
      categoriesData = categoryGroups.flatMap((cg) => cg.categories);
    }

    const budgetAlerts = getBudgetAlerts(budgetSettings.notifications, {
      accounts: accountsData,
      categories: categoriesData,
      unapprovedTxs,
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
  await currentAlertsStorage.setValue(alerts);
}
