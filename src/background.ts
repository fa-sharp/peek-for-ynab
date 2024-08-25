import { type Account, type Category, type TransactionDetail, api } from "ynab";

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
  createDesktopNotifications,
  getBudgetAlerts,
  updateIconAndTooltip
} from "~lib/notifications";
import { queryClient } from "~lib/queryClient";
import { IS_DEV, ONE_DAY_IN_MILLIS, isEmptyObject } from "~lib/utils";

const CHROME_LOCAL_STORAGE = new Storage({ area: "local" });
const CHROME_SESSION_STORAGE = new Storage({ area: "session" });
const TOKEN_STORAGE = new Storage({ area: "local" });

const IS_REFRESHING_KEY = "isRefreshing";

// Listen for token refresh signal
TOKEN_STORAGE.watch({
  [REFRESH_NEEDED_KEY]: async (c) => {
    if (
      c.newValue !== true ||
      (await CHROME_SESSION_STORAGE.get<boolean>(IS_REFRESHING_KEY))
    )
      return;
    await refreshToken();
  }
});

// Setup periodic background refresh
const BACKGROUND_ALARM_NAME = "backgroundRefresh";
chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name !== BACKGROUND_ALARM_NAME) return;
  backgroundDataRefresh();
});
chrome.alarms.get(BACKGROUND_ALARM_NAME).then(async (alarm) => {
  if (!alarm) {
    IS_DEV && console.log("Setting up new alarm!");
    await chrome.alarms.clearAll();
    await chrome.alarms.create(BACKGROUND_ALARM_NAME, {
      periodInMinutes: 15
    });
  } else {
    IS_DEV && console.log("Alarm already exists!");
  }
});

async function refreshToken(): Promise<TokenData | null> {
  await CHROME_SESSION_STORAGE.set(IS_REFRESHING_KEY, true);

  // check if token exists
  const tokenData = await TOKEN_STORAGE.get<TokenData | null>(TOKEN_STORAGE_KEY);
  if (!tokenData) {
    console.error("Not refreshing - no existing token data found");
    await CHROME_SESSION_STORAGE.set(IS_REFRESHING_KEY, false);
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
    await CHROME_SESSION_STORAGE.set(IS_REFRESHING_KEY, false);
  } catch (err) {
    console.error("Failed to signal refresh completion:", err);
  }

  return newTokenData;
}

async function backgroundDataRefresh() {
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
      const budgetSettings = await storage.get<BudgetSettings>(`budget-${budget.id}`);
      if (!budgetSettings) continue;

      let importedTxs: TransactionDetail[] | undefined;
      let accountsData: Account[] | undefined;
      let categoriesData: Category[] | undefined;

      if (budgetSettings.notifications.checkImports) {
        importedTxs = await importTxsForBudget(ynabAPI, budget.id);
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

    IS_DEV && console.log("Background refresh: updating alerts...", alerts);
    updateIconAndTooltip(alerts, budgetsData);
    if (
      JSON.stringify(alerts) !==
      JSON.stringify(await CHROME_LOCAL_STORAGE.get("currentAlerts"))
    ) {
      createDesktopNotifications(alerts, budgetsData);
      await CHROME_LOCAL_STORAGE.set("currentAlerts", alerts);
    }
  } catch (err) {
    console.error("Background refresh: Error", err);
  }
}
