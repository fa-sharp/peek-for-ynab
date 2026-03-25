import {
  accountsQuery,
  budgetQuery,
  categoryGroupsQuery,
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget,
  fetchUnapprovedTxsForBudget,
} from "~lib/api";
import {
  type Account,
  apiClient,
  type Category,
  type TransactionDetail,
} from "~lib/api/client";
import { IS_DEV } from "~lib/constants";
import {
  type CurrentAlerts,
  createSystemNotification,
  getBudgetAlerts,
  updateIconAndTooltip,
} from "~lib/notifications";
import { createQueryClient, queryPersister } from "~lib/queryClient";
import { checkPermissions, isEmptyObject } from "~lib/utils";
import {
  AuthManager,
  appSettingsStorage,
  authTokenStorage,
  budgetSettingsStorage,
  currentAlertsStorage,
  shouldSyncStorage,
} from "./state";
import type { BudgetSettings } from "./types";

export async function backgroundDataRefresh() {
  IS_DEV && console.log("Background refresh: Starting...");

  // Get the configured budgets and their settings
  const syncEnabled = await shouldSyncStorage.getValue();
  const storageArea = syncEnabled ? "sync" : "local";
  const { budgets: budgetIds } = await appSettingsStorage(storageArea).getValue();
  if (!budgetIds || budgetIds.length === 0) {
    IS_DEV && console.log("Background refresh: No budgets configured");
    return;
  }

  const selectedBudgetSettings: { [budgetId: string]: BudgetSettings } = {};
  for (const budgetId of budgetIds) {
    const budgetSettings = await budgetSettingsStorage(budgetId, storageArea).getValue();
    selectedBudgetSettings[budgetId] = budgetSettings;
  }

  // Skip background refresh if no notifications are enabled
  if (
    isEmptyObject(selectedBudgetSettings) ||
    Object.values(selectedBudgetSettings).every(
      (settings) =>
        [
          settings.notifications.overspent,
          settings.notifications.checkImports,
          settings.notifications.importError,
        ].every((enabled) => enabled === false) &&
        isEmptyObject(settings.notifications.reconcileAlerts)
    )
  ) {
    IS_DEV && console.log("Background refresh: No notifications enabled");
    return;
  }

  // Get the access token
  const authToken = await authTokenStorage.getValue();
  if (!authToken) {
    IS_DEV && console.log("Background refresh: no auth token");
    return;
  }
  const tokenResponse = await AuthManager.fetchToken(authToken);
  if (!tokenResponse.success) {
    console.warn("Background refresh: failed to get access token:", tokenResponse.error);
    return;
  }
  const { accessToken } = tokenResponse;

  // Create a query client with a longer default stale time, and restore the cache from IndexedDB
  const queryClient = createQueryClient({
    staleTime: 10 * 60 * 1000,
  });
  await queryPersister.restoreQueries(queryClient);

  IS_DEV && console.log("Background refresh: fetching data and updating alerts...");
  const budgetsData = await queryClient.fetchQuery({
    ...budgetQuery,
    queryFn: () => fetchBudgets(accessToken),
  });

  const alerts: CurrentAlerts = {};
  const oldAlerts = await currentAlertsStorage.getValue();
  const notificationsEnabled = await checkPermissions(["notifications"]);

  // Fetch new data for each budget and update alerts
  for (const budget of budgetsData.filter(({ id }) => budgetIds.includes(id))) {
    const budgetSettings = selectedBudgetSettings[budget.id];
    if (!budgetSettings) continue;

    let unapprovedTxs: TransactionDetail[] | undefined;
    let accountsData: Account[] | undefined;
    let categoriesData: Category[] | undefined;

    if (budgetSettings.notifications.checkImports) {
      // call import API, then check for unapproved transactions
      await queryClient.fetchQuery({
        queryKey: ["import", { budgetId: budget.id }],
        staleTime: 50 * 60 * 1000, // 50 minutes
        queryFn: async () => {
          const { data, error } = await apiClient(accessToken).POST(
            "/plans/{plan_id}/transactions/import",
            {
              params: { path: { plan_id: budget.id } },
            }
          );
          if (error) throw error;
          return data.data.transaction_ids;
        },
      });
      unapprovedTxs = await fetchUnapprovedTxsForBudget(accessToken, budget.id);
    }

    if (
      budgetSettings.notifications.importError ||
      !isEmptyObject(budgetSettings.notifications.reconcileAlerts)
    ) {
      const { accounts } = await queryClient.fetchQuery({
        ...accountsQuery(budget.id),
        queryFn: ({ queryKey }) =>
          fetchAccountsForBudget(
            accessToken,
            budget.id,
            queryClient.getQueryState(queryKey)
          ),
      });
      accountsData = accounts;
    }

    if (budgetSettings.notifications.overspent) {
      const { categoryGroups } = await queryClient.fetchQuery({
        ...categoryGroupsQuery(budget.id),
        queryFn: ({ queryKey }) =>
          fetchCategoryGroupsForBudget(
            accessToken,
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
