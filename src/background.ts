import { type Account, type Category, api } from "ynab";

import { Storage } from "@plasmohq/storage";

import {
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget,
  importTxsForBudget
} from "~lib/api";
import { REFRESH_NEEDED_KEY, TOKEN_STORAGE_KEY } from "~lib/constants";
import type { BudgetSettings, TokenData } from "~lib/context/storageContext";
import {
  type CurrentAlerts,
  createRichNotification,
  getBudgetAlerts,
  updateIconTooltipWithAlerts
} from "~lib/notifications";
import { queryClient } from "~lib/queryClient";
import { IS_DEV, ONE_DAY_IN_MILLIS, isEmptyObject } from "~lib/utils";

const CHROME_LOCAL_STORAGE = new Storage({ area: "local" });
const TOKEN_STORAGE = new Storage({ area: "local" });
let isRefreshing = false;

TOKEN_STORAGE.watch({
  [REFRESH_NEEDED_KEY]: async (c) => {
    if (c.newValue !== true || isRefreshing) return;
    await refreshToken();
  }
});

async function refreshToken(): Promise<TokenData | null> {
  isRefreshing = true;

  // check if token exists
  const tokenData = await TOKEN_STORAGE.get<TokenData | null>(TOKEN_STORAGE_KEY);
  if (!tokenData) {
    console.error("Not refreshing - no existing token data found");
    isRefreshing = false;
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
    await TOKEN_STORAGE.set(REFRESH_NEEDED_KEY, false);
  } finally {
    isRefreshing = false;
  }

  return newTokenData;
}

const BACKGROUND_ALARM_NAME = "backgroundRefresh";

const backgroundDataRefresh = async (alarm: chrome.alarms.Alarm) => {
  if (alarm.name !== BACKGROUND_ALARM_NAME) return;

  IS_DEV && console.log("Background refresh: Starting...");
  try {
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
    const storage = new Storage({ area: syncEnabled ? "sync" : "local" });
    const shownBudgetIds = await storage.get<string[]>("budgets");
    if (!shownBudgetIds) return;

    // Fetch new data and get updated alerts
    const ynabAPI = new api(tokenData.accessToken);
    const budgetsData = await queryClient.fetchQuery({
      queryKey: ["budgets"],
      staleTime: ONE_DAY_IN_MILLIS * 2,
      queryFn: () => fetchBudgets(ynabAPI)
    });

    const alerts: CurrentAlerts = {};
    for (const budget of budgetsData.filter(({ id }) => shownBudgetIds.includes(id))) {
      const budgetSettings = await storage.get<BudgetSettings | undefined>(
        `budget-${budget.id}`
      );
      if (!budgetSettings) continue;

      let importedTxs: string[] | undefined;
      let accountsData: Account[] | undefined;
      let categoriesData: Category[] | undefined;

      if (budgetSettings.notifications.checkImports) {
        importedTxs = await queryClient.fetchQuery({
          queryKey: ["import", { budgetId: budget.id }],
          staleTime: 1000 * 60 * 25, // 25 minutes
          queryFn: () => importTxsForBudget(ynabAPI, budget.id)
        });
      }

      if (
        budgetSettings.notifications.importError ||
        !isEmptyObject(budgetSettings.notifications.reconcileAlerts)
      ) {
        accountsData = await fetchAccountsForBudget(ynabAPI, budget.id);
      }

      if (budgetSettings.notifications.overspent) {
        const categoryGroupsData = await fetchCategoryGroupsForBudget(ynabAPI, budget.id);
        categoriesData = categoryGroupsData.flatMap((cg) => cg.categories);
      }

      const budgetAlerts = getBudgetAlerts(budgetSettings.notifications, {
        accounts: accountsData,
        categories: categoriesData,
        importedTxs
      });
      if (budgetAlerts) alerts[budget.id] = budgetAlerts;
    }

    IS_DEV &&
      console.log("Background refresh: Got updated alerts, updating alerts...", alerts);
    updateIconTooltipWithAlerts(alerts, budgetsData);
    createRichNotification(alerts, budgetsData);
    await CHROME_LOCAL_STORAGE.set("currentAlerts", alerts);
  } catch (err) {
    console.error("Background refresh: Error", err);
  }
};

chrome.alarms.onAlarm.removeListener(backgroundDataRefresh);
chrome.alarms.onAlarm.addListener(backgroundDataRefresh);
chrome.alarms.get(BACKGROUND_ALARM_NAME).then(async (alarm) => {
  if (!alarm) {
    await chrome.alarms.clearAll();
    await chrome.alarms.create(BACKGROUND_ALARM_NAME, {
      periodInMinutes: 30,
      delayInMinutes: IS_DEV ? 10 : 0
    });
  }
});
