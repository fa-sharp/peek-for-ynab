import { type Browser, browser, defineBackground } from "#imports";
import { backgroundDataRefresh } from "~lib/backgroundRefresh";
import { BACKGROUND_ALARM_NAME, IS_DEV } from "~lib/constants";
import { onMessage } from "~lib/messaging";
import {
  checkBrowserBarPermission,
  createBrowserBarSuggestions,
  getBrowserBarBudgets,
  getBrowserBarDataForBudget,
  getPossibleTransferFieldCombinations,
  getPossibleTxFieldCombinations,
  parseTxInput,
} from "~lib/omnibox";
import { AuthManager, popupStateStorage, txStore } from "~lib/state";
import { searchWithinString, waitForInternetConnection } from "~lib/utils";

export default defineBackground(() => {
  // Handle token fetch requests from popup
  onMessage("fetchToken", ({ data: { authToken } }) => AuthManager.fetchToken(authToken));

  // Setup periodic background refresh
  browser.alarms.onAlarm.addListener(async (alarm: Browser.alarms.Alarm) => {
    if (alarm.name === BACKGROUND_ALARM_NAME) {
      try {
        await waitForInternetConnection();
        await backgroundDataRefresh();
      } catch (err) {
        console.error("Background refresh: Error", err);
      }
    }
  });
  browser.alarms.get(BACKGROUND_ALARM_NAME).then(async (alarm) => {
    if (!alarm) {
      IS_DEV && console.log("Setting up new alarm!");
      await browser.alarms.clearAll();
      await browser.alarms.create(BACKGROUND_ALARM_NAME, {
        periodInMinutes: 15,
      });
    } else {
      IS_DEV && console.log("Alarm already exists!");
    }
  });

  // Setup system notification click handler
  const onSystemNotificationClick = (id: string) => {
    browser.notifications.clear(id);
    browser.tabs.create({ url: `https://app.ynab.com/${id}/budget` });
  };
  browser.notifications?.onClicked.removeListener(onSystemNotificationClick);
  browser.notifications?.onClicked.addListener(onSystemNotificationClick);

  // Setup browser bar
  const OMNIBOX_START_TEXT = "add <dim>or</dim> transfer";
  browser.omnibox.onInputStarted.addListener(async () => {
    if (!(await checkBrowserBarPermission())) {
      browser.omnibox.setDefaultSuggestion({
        description: "URL/address bar not enabled in settings!",
      });
    } else {
      browser.omnibox.setDefaultSuggestion({
        description: OMNIBOX_START_TEXT,
      });
      const budgetId = (await popupStateStorage.getValue())?.budgetId;
      if (budgetId) getBrowserBarDataForBudget(budgetId);
    }
  });
  browser.omnibox.onInputCancelled.addListener(async () => {
    if (!(await checkBrowserBarPermission())) {
      browser.omnibox.setDefaultSuggestion({
        description: "URL/address bar not enabled in settings!",
      });
    } else {
      browser.omnibox.setDefaultSuggestion({
        description: OMNIBOX_START_TEXT,
      });
    }
  });
  browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
    if (!(await checkBrowserBarPermission())) return;

    browser.omnibox.setDefaultSuggestion({
      description: text.startsWith("add")
        ? "add (<dim>amount</dim>) (in <dim>budget</dim>) (at <dim>payee</dim>) (for <dim>category</dim>) (on <dim>account</dim>) (memo <dim>memo</dim>)"
        : text.startsWith("transfer")
          ? "transfer (<dim>amount</dim>) (in <dim>budget</dim>) (from|to <dim>account</dim>) (from|to <dim>account</dim>) (for <dim>category</dim>) (memo <dim>memo</dim>)"
          : OMNIBOX_START_TEXT,
    });
    const parsedQuery = parseTxInput(text);
    if (!parsedQuery) return;

    const budgets = await getBrowserBarBudgets();
    const budgetId = parsedQuery.budgetQuery
      ? budgets.find((b) => searchWithinString(b.name, parsedQuery.budgetQuery!.trim()))
          ?.id
      : (await popupStateStorage.getValue())?.budgetId;
    if (!budgetId) {
      browser.omnibox.setDefaultSuggestion({ description: "Budget not found!" });
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
        parsedQuery.memo,
        parsedQuery.type === "tx" ? parsedQuery.amountType : undefined
      )
    );
  });
  browser.omnibox.onInputEntered.addListener(async (text) => {
    if (!(await checkBrowserBarPermission())) return;

    const parsedQuery = parseTxInput(text);
    if (!parsedQuery) return;

    const budgets = await getBrowserBarBudgets();
    const budgetId = parsedQuery.budgetQuery
      ? budgets.find((b) => searchWithinString(b.name, parsedQuery.budgetQuery!.trim()))
          ?.id
      : (await popupStateStorage.getValue())?.budgetId;
    if (!budgetId) return;

    const data = await getBrowserBarDataForBudget(budgetId);
    const [fields] =
      parsedQuery.type === "tx"
        ? getPossibleTxFieldCombinations(parsedQuery, data)
        : getPossibleTransferFieldCombinations(parsedQuery, data);
    IS_DEV && console.log("Received tx from omnibox:", { parsedQuery, fields });

    await txStore.setState({
      amount: parsedQuery.amount ?? "",
      amountType: "amountType" in parsedQuery ? parsedQuery.amountType : "Outflow",
      payee: fields?.payee ?? null,
      accountId: fields?.account?.id ?? null,
      categoryId: fields?.category?.id ?? null,
      memo: parsedQuery.memo?.trim() ?? null,
      isTransfer: parsedQuery.type === "transfer",
    });
    await popupStateStorage.setValue({
      view: "txAdd",
      budgetId,
    });
    browser.action.openPopup();
  });
});
