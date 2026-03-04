import { type Browser, browser, defineBackground } from "#imports";
import {
  backgroundDataRefresh,
  IS_TOKEN_REFRESHING_KEY,
  refreshToken,
} from "~lib/backgroundRefresh";
import {
  BACKGROUND_ALARM_NAME,
  CHROME_LOCAL_STORAGE,
  CHROME_SESSION_STORAGE,
  IS_DEV,
  REFRESH_SIGNAL_KEY,
  TOKEN_STORAGE,
} from "~lib/constants";
import {
  checkBrowserBarPermission,
  createBrowserBarSuggestions,
  getBrowserBarBudgets,
  getBrowserBarDataForBudget,
  getPossibleTransferFieldCombinations,
  getPossibleTxFieldCombinations,
  parseTxInput,
} from "~lib/omnibox";
import type { PopupState, TxAddInitialState } from "~lib/types";
import { searchWithinString, waitForInternetConnection } from "~lib/utils";

export default defineBackground(() => {
  // Listen for token refresh signal
  TOKEN_STORAGE.watch({
    [REFRESH_SIGNAL_KEY]: async (c) => {
      if (
        c.newValue !== true ||
        (await CHROME_SESSION_STORAGE.get<boolean>(IS_TOKEN_REFRESHING_KEY))
      )
        return;
      await refreshToken();
    },
  });

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
      const budgetId = (await CHROME_LOCAL_STORAGE.get<PopupState>("popupState"))
        ?.budgetId;
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
      : (await CHROME_LOCAL_STORAGE.get<PopupState>("popupState"))?.budgetId;
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
      : (await CHROME_LOCAL_STORAGE.get<PopupState>("popupState"))?.budgetId;
    if (!budgetId) return;

    const data = await getBrowserBarDataForBudget(budgetId);
    const [tx] =
      parsedQuery.type === "tx"
        ? getPossibleTxFieldCombinations(parsedQuery, data)
        : getPossibleTransferFieldCombinations(parsedQuery, data);
    IS_DEV && console.log("Received tx fields from omnibox:", tx);

    await CHROME_LOCAL_STORAGE.set("txState", {
      amount: parsedQuery.amount,
      amountType: "amountType" in parsedQuery ? parsedQuery.amountType : "Outflow",
      payee: tx?.payee,
      accountId: tx?.account?.id,
      categoryId: tx?.category?.id,
      memo: parsedQuery.memo?.trim(),
      isTransfer: parsedQuery.type === "transfer",
    } satisfies TxAddInitialState);
    await CHROME_LOCAL_STORAGE.set("popupState", {
      view: "txAdd",
      budgetId: budgetId,
    } satisfies PopupState);
    browser.action.openPopup();
  });
});
