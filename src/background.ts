import {
  type Account,
  type Category,
  type CategoryGroupWithCategories,
  type TransactionDetail,
  api
} from "ynab";

import { Storage } from "@plasmohq/storage";

import {
  checkUnapprovedTxsForBudget,
  fetchAccountsForBudget,
  fetchBudgets,
  fetchCategoryGroupsForBudget
} from "~lib/api";
import { REFRESH_SIGNAL_KEY, TOKEN_STORAGE_KEY } from "~lib/constants";
import type { BudgetSettings, TokenData } from "~lib/context/storageContext";
import type { CachedPayee } from "~lib/context/ynabContext";
import {
  type CurrentAlerts,
  createSystemNotification,
  getBudgetAlerts,
  updateIconAndTooltip
} from "~lib/notifications";
import { createQueryClient } from "~lib/queryClient";
import {
  IS_DEV,
  ONE_DAY_IN_MILLIS,
  checkPermissions,
  formatCurrency,
  isEmptyObject,
  searchWithinString,
  stringValueToMillis
} from "~lib/utils";

const CHROME_LOCAL_STORAGE = new Storage({ area: "local" });
const CHROME_SESSION_STORAGE = new Storage({ area: "session" });
const TOKEN_STORAGE = new Storage({ area: "local" });

const IS_REFRESHING_KEY = "isRefreshing";

// Listen for token refresh signal
TOKEN_STORAGE.watch({
  [REFRESH_SIGNAL_KEY]: async (c) => {
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
  if (alarm.name === BACKGROUND_ALARM_NAME) {
    try {
      backgroundDataRefresh();
    } catch (err) {
      console.error("Background refresh: Error", err);
    }
  }
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
    await TOKEN_STORAGE.set(REFRESH_SIGNAL_KEY, false);
    await CHROME_SESSION_STORAGE.set(IS_REFRESHING_KEY, false);
  } catch (err) {
    console.error("Failed to signal refresh completion:", err);
  }

  return newTokenData;
}

async function backgroundDataRefresh() {
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
  const storage = syncEnabled ? new Storage({ area: "sync" }) : CHROME_LOCAL_STORAGE;
  const shownBudgetIds = await storage.get<string[]>("budgets");
  if (!shownBudgetIds) return;

  IS_DEV && console.log("Background refresh: updating alerts...");
  const ynabAPI = new api(tokenData.accessToken);
  const queryClient = createQueryClient({
    staleTime: 14 * 60 * 1000 // to prevent too many refetches, data is assumed fresh for 14 minutes
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
  for (const budget of budgetsData.filter(({ id }) => shownBudgetIds.includes(id))) {
    const budgetSettings = await storage.get<BudgetSettings>(`budget-${budget.id}`);
    if (!budgetSettings) continue;

    let unapprovedTxs: TransactionDetail[] | undefined;
    let accountsData: Account[] | undefined;
    let categoriesData: Category[] | undefined;

    if (budgetSettings.notifications.checkImports) {
      await ynabAPI.transactions.importTransactions(budget.id);
      unapprovedTxs = await checkUnapprovedTxsForBudget(ynabAPI, budget.id);
    }

    // FIXME Two `fetchQuery` calls and setTimeout needed because of React Query persister issues in non-React context
    // See https://github.com/TanStack/query/issues/8075
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
      await new Promise((r) => setTimeout(r, 200));
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
      await new Promise((r) => setTimeout(r, 200));
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

// Setup system notification click handler
const onSystemNotificationClick = (id: string) => {
  chrome.notifications.clear(id);
  chrome.tabs.create({ url: `https://app.ynab.com/${id}/budget` });
};
chrome.notifications?.onClicked.removeListener(onSystemNotificationClick);
chrome.notifications?.onClicked.addListener(onSystemNotificationClick);

// Setup omnibox
chrome.omnibox.setDefaultSuggestion({
  description:
    "<dim>amount</dim> (at <dim>payee</dim>) (for <dim>category</dim>) (on <dim>account</dim>) (memo <dim>memo</dim>)"
});
chrome.omnibox.onInputEntered.addListener((text) => {
  console.log("Received transaction:", JSON.parse(text));
  chrome.action.openPopup();
});

const omniCache: {
  payees?: CachedPayee[];
  categories?: Category[];
  accounts?: Account[];
} = {};
const primeOmniCache = async (key: "payees" | "categories" | "accounts") => {
  console.log("priming cache..");
  const queryClient = createQueryClient({
    staleTime: ONE_DAY_IN_MILLIS * 7
  });
  const budgetId = "a1ce2dcc-0ed5-4d3d-946f-f4ee35af775c";
  switch (key) {
    case "payees": {
      const { payees } = await queryClient.fetchQuery<{ payees: CachedPayee[] }>({
        queryKey: ["payees", { budgetId }],
        queryFn: () => ({ payees: [] })
      });
      omniCache.payees = payees;
      return { payees };
    }
    case "categories": {
      const { categoryGroups } = await queryClient.fetchQuery<{
        categoryGroups: CategoryGroupWithCategories[];
      }>({
        queryKey: ["categoryGroups", { budgetId }],
        queryFn: () => ({ categoryGroups: [] })
      });
      categoryGroups.splice(1, 1); // CCP
      const categories = categoryGroups.flatMap((cg) => cg.categories);
      categories.splice(1, 2); // Internal master, deferred
      omniCache.categories = categories;
      return { categories };
    }
    case "accounts": {
      const { accounts } = await queryClient.fetchQuery<{
        accounts: Account[];
      }>({
        queryKey: ["accounts", { budgetId }],
        queryFn: () => ({ accounts: [] })
      });
      omniCache.accounts = accounts;
      return { accounts };
    }
    default:
      return {};
  }
};
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const [amount, ...dataToParse] = text.split(" ");
  if (!amount || dataToParse.length === 0) return suggest([]);
  /** payee, category, account, memo */
  const parsedData: [string, string, string, string] = ["", "", "", ""];
  let parsedIdx = -1;
  for (const word of dataToParse) {
    if (word === "at" && parsedIdx < 0) parsedIdx = 0;
    else if (word === "for" && parsedIdx < 1) parsedIdx = 1;
    else if (word === "on" && parsedIdx < 2) parsedIdx = 2;
    else if (word === "memo" && parsedIdx < 3) parsedIdx = 3;
    else if (parsedIdx >= 0) parsedData[parsedIdx] += word + " ";
  }
  const [payeeQuery, categoryQuery, accountQuery, memo] = parsedData;
  let payeeResults: CachedPayee[] = [];
  let categoryResults: Category[] = [];
  let accountResults: Account[] = [];

  if (payeeQuery) {
    const payees = omniCache.payees || (await primeOmniCache("payees")).payees;
    payeeResults =
      payees?.filter((p) => searchWithinString(p.name, payeeQuery.trim())).slice(0, 5) ||
      [];
  }
  if (categoryQuery) {
    const categories =
      omniCache.categories || (await primeOmniCache("categories")).categories;
    categoryResults =
      categories
        ?.filter((c) => searchWithinString(c.name, categoryQuery.trim()))
        .slice(0, 5) || [];
  }
  if (accountQuery) {
    const accounts = omniCache.accounts || (await primeOmniCache("accounts")).accounts;
    accountResults =
      accounts
        ?.filter((a) => searchWithinString(a.name, accountQuery.trim()))
        .slice(0, 5) || [];
  }

  let suggestions: { payee?: CachedPayee; account?: Account; category?: Category }[] = [];
  for (const payee of payeeResults) {
    suggestions.push({ payee });
  }
  if (suggestions.length === 0)
    categoryResults.forEach((category) => suggestions.push({ category }));
  else if (categoryResults.length > 0) {
    suggestions = categoryResults.flatMap((category) =>
      suggestions.map((suggestion) => ({ ...suggestion, category }))
    );
  }
  if (suggestions.length === 0)
    accountResults.forEach((account) => suggestions.push({ account }));
  else if (accountResults.length > 0) {
    suggestions = accountResults.flatMap((account) =>
      suggestions.map((suggestion) => ({ ...suggestion, account }))
    );
  }

  suggest(
    suggestions.map(({ payee, category, account }) => ({
      content: JSON.stringify({
        amount,
        payee: payee?.id,
        account: account?.id,
        category: category?.id,
        memo: memo.trim() || undefined
      }),
      description:
        "add " +
        formatCurrency(stringValueToMillis(amount, "Outflow")) +
        (payee ? ` at <match>${escapeXML(payee!.name)}</match>` : "") +
        (category ? ` for <match>${escapeXML(category!.name)}</match>` : "") +
        (account ? ` on <match>${escapeXML(account!.name)}</match>` : "") +
        (memo ? ` memo <match>${escapeXML(memo)}</match>` : "")
    }))
  );
});
const xmlEscapedChars: Record<string, string> = {
  '"': "&quot;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;"
};
function escapeXML(xmlString: string) {
  let escaped = "";
  for (const c of xmlString) {
    escaped += xmlEscapedChars[c] || c;
  }
  return escaped;
}
