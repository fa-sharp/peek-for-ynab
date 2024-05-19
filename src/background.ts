import { type Account, type Category, api } from "ynab";

import { Storage } from "@plasmohq/storage";

import {
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget
} from "~lib/api";
import { REFRESH_NEEDED_KEY, TOKEN_STORAGE_KEY } from "~lib/constants";
import type { BudgetSettings, TokenData } from "~lib/context/storageContext";
import {
  type CurrentAlerts,
  getBudgetAlerts,
  updateIconTooltipWithAlerts
} from "~lib/notifications";
import { queryClient } from "~lib/queryClient";
import { IS_DEV, ONE_DAY_IN_MILLIS, isEmptyObject } from "~lib/utils";

const chromeLocalStorage = new Storage({ area: "local" });
const tokenStorage = new Storage({ area: "local" });
let isRefreshing = false;

tokenStorage.watch({
  [REFRESH_NEEDED_KEY]: async (c) => {
    if (c.newValue !== true || isRefreshing) return;
    await refreshToken();
  }
});

async function refreshToken(): Promise<TokenData | null> {
  isRefreshing = true;

  // check if token exists
  const tokenData = await tokenStorage.get<TokenData | null>(TOKEN_STORAGE_KEY);
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
      if (res.status === 401) await tokenStorage.set(TOKEN_STORAGE_KEY, null); // clear token if status is unauthorized
      throw {
        message: "Error from API while refreshing token",
        status: res.status,
        error: await res.text()
      };
    }
    newTokenData = await res.json();
    IS_DEV && console.log("Got a new token!");
    await tokenStorage.set(TOKEN_STORAGE_KEY, newTokenData);
  } catch (err) {
    console.error("Failed to refresh token:", err);
  }

  // signal that refresh is complete
  try {
    await tokenStorage.set(REFRESH_NEEDED_KEY, false);
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
    let tokenData = await tokenStorage.get<TokenData | null>(TOKEN_STORAGE_KEY);
    if (!tokenData) {
      console.error("Background refresh: no existing token data found");
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

    // TODO figure out local vs sync storage (can't access localStorage here)
    const storage = new Storage({ area: "local" });
    const shownBudgetIds = await storage.get<string[]>("budgets");
    if (!shownBudgetIds) return;
    const ynabAPI = new api(tokenData.accessToken);

    // Fetch new data and get updated alerts
    const budgetsData = await queryClient.fetchQuery({
      queryKey: ["budgets"],
      staleTime: ONE_DAY_IN_MILLIS,
      queryFn: () => fetchBudgets(ynabAPI)
    });
    IS_DEV && console.log("Background refresh: Fetched budgets", budgetsData);

    const alerts: CurrentAlerts = {};
    for (const budget of budgetsData.filter(({ id }) => shownBudgetIds.includes(id))) {
      const budgetSettings = await storage.get<BudgetSettings | undefined>(
        `budget-${budget.id}`
      );
      if (!budgetSettings) continue;

      let accountsData: Account[] | undefined;
      let categoriesData: Category[] | undefined;
      if (
        budgetSettings.notifications.importError ||
        !isEmptyObject(budgetSettings.notifications.reconcileAlerts)
      ) {
        accountsData = await fetchAccountsForBudget(ynabAPI, budget.id);
        IS_DEV &&
          console.log("Background refresh: Fetched accounts", {
            budgetId: budget.id,
            accountsData
          });
      }
      if (budgetSettings.notifications.overspent) {
        const categoryGroupsData = await fetchCategoryGroupsForBudget(ynabAPI, budget.id);
        categoriesData = categoryGroupsData.flatMap((cg) => cg.categories);
        IS_DEV &&
          console.log("Background refresh: Fetched categories", {
            budgetId: budget.id,
            categoryGroupsData
          });
      }

      const budgetAlerts = getBudgetAlerts(budgetSettings.notifications, {
        accounts: accountsData,
        categories: categoriesData
      });
      if (budgetAlerts) alerts[budget.id] = budgetAlerts;
    }

    IS_DEV &&
      console.log(
        "Background refresh: Got updated alerts, updating icon + tooltip...",
        alerts
      );
    updateIconTooltipWithAlerts(alerts, budgetsData);
    await chromeLocalStorage.set("currentAlerts", alerts);
  } catch (err) {
    console.error("Background refresh: Error", err);
  }
};

chrome.alarms.clearAll().then(() => {
  chrome.alarms.onAlarm.removeListener(backgroundDataRefresh);
  chrome.alarms.onAlarm.addListener(backgroundDataRefresh);
  chrome.alarms.create(BACKGROUND_ALARM_NAME, {
    periodInMinutes: 30,
    delayInMinutes: IS_DEV ? 10 : 0
  });
});
