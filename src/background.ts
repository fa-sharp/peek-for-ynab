import {
  IS_TOKEN_REFRESHING_KEY,
  backgroundDataRefresh,
  refreshToken
} from "~lib/backgroundRefresh";
import {
  CHROME_LOCAL_STORAGE,
  CHROME_SESSION_STORAGE,
  IS_DEV,
  REFRESH_SIGNAL_KEY,
  TOKEN_STORAGE
} from "~lib/constants";
import {
  checkBrowserBarPermission,
  createBrowserBarSuggestions,
  getBrowserBarBudgets,
  getBrowserBarDataForBudget,
  getPossibleTransferFieldCombinations,
  getPossibleTxFieldCombinations,
  parseTxInput
} from "~lib/omnibox";
import type { PopupState } from "~lib/types";
import { searchWithinString } from "~lib/utils";

// Listen for token refresh signal
TOKEN_STORAGE.watch({
  [REFRESH_SIGNAL_KEY]: async (c) => {
    if (
      c.newValue !== true ||
      (await CHROME_SESSION_STORAGE.get<boolean>(IS_TOKEN_REFRESHING_KEY))
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

// Setup system notification click handler
const onSystemNotificationClick = (id: string) => {
  chrome.notifications.clear(id);
  chrome.tabs.create({ url: `https://app.ynab.com/${id}/budget` });
};
chrome.notifications?.onClicked.removeListener(onSystemNotificationClick);
chrome.notifications?.onClicked.addListener(onSystemNotificationClick);

// Setup browser bar
const OMNIBOX_START_TEXT = "add <dim>or</dim> transfer";
chrome.omnibox.onInputStarted.addListener(async () => {
  if (!(await checkBrowserBarPermission())) {
    chrome.omnibox.setDefaultSuggestion({
      description: "URL/address bar not enabled in settings!"
    });
  } else {
    chrome.omnibox.setDefaultSuggestion({
      description: OMNIBOX_START_TEXT
    });
    const budgetId = (await CHROME_LOCAL_STORAGE.get<PopupState>("popupState"))?.budgetId;
    if (budgetId) getBrowserBarDataForBudget(budgetId);
  }
});
chrome.omnibox.onInputCancelled.addListener(async () => {
  if (!(await checkBrowserBarPermission())) {
    chrome.omnibox.setDefaultSuggestion({
      description: "URL/address bar not enabled in settings!"
    });
  } else {
    chrome.omnibox.setDefaultSuggestion({
      description: OMNIBOX_START_TEXT
    });
  }
});
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  if (!(await checkBrowserBarPermission())) return;

  chrome.omnibox.setDefaultSuggestion({
    description: text.startsWith("add")
      ? "add (<dim>amount</dim>) (in <dim>budget</dim>) (at <dim>payee</dim>) (for <dim>category</dim>) (on <dim>account</dim>) (memo <dim>memo</dim>)"
      : text.startsWith("transfer")
        ? "transfer (<dim>amount</dim>) (in <dim>budget</dim>) (from|to <dim>account</dim>) (from|to <dim>account</dim>) (for <dim>category</dim>) (memo <dim>memo</dim>)"
        : OMNIBOX_START_TEXT
  });
  const parsedQuery = parseTxInput(text);
  if (!parsedQuery) return;

  const budgets = await getBrowserBarBudgets();
  const budgetId = parsedQuery.budgetQuery
    ? budgets.find((b) => searchWithinString(b.name, parsedQuery.budgetQuery!.trim()))?.id
    : (await CHROME_LOCAL_STORAGE.get<PopupState>("popupState"))?.budgetId;
  if (!budgetId) {
    chrome.omnibox.setDefaultSuggestion({ description: "Budget not found!" });
    return;
  }

  const data = await getBrowserBarDataForBudget(budgetId);
  const possibleTxFields =
    parsedQuery.type === "tx"
      ? getPossibleTxFieldCombinations(parsedQuery, data)
      : getPossibleTransferFieldCombinations(parsedQuery, data);
  suggest(
    createBrowserBarSuggestions(
      parsedQuery.type,
      possibleTxFields,
      parsedQuery.budgetQuery ? budgets.find((b) => b.id === budgetId) : undefined,
      parsedQuery.amount,
      parsedQuery.memo
    )
  );
});
chrome.omnibox.onInputEntered.addListener(async (text) => {
  if (!(await checkBrowserBarPermission())) return;

  const parsedQuery = parseTxInput(text);
  if (!parsedQuery) return;

  const budgets = await getBrowserBarBudgets();
  const budgetId = parsedQuery.budgetQuery
    ? budgets.find((b) => searchWithinString(b.name, parsedQuery.budgetQuery!.trim()))?.id
    : (await CHROME_LOCAL_STORAGE.get<PopupState>("popupState"))?.budgetId;
  if (!budgetId) return;

  const data = await getBrowserBarDataForBudget(budgetId);
  const [tx] =
    parsedQuery.type === "tx"
      ? getPossibleTxFieldCombinations(parsedQuery, data)
      : getPossibleTransferFieldCombinations(parsedQuery, data);
  IS_DEV && console.log("Received tx fields from omnibox:", tx);

  await CHROME_LOCAL_STORAGE.set("popupState", {
    view: "txAdd",
    budgetId: budgetId,
    txAddState: {
      amount: parsedQuery.amount,
      payee: tx?.payee,
      accountId: tx?.account?.id,
      categoryId: tx?.category?.id,
      memo: parsedQuery.memo?.trim(),
      isTransfer: parsedQuery.type === "transfer"
    }
  } satisfies PopupState);
  chrome.action.openPopup();
});
