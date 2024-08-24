import type { Account, Category, TransactionDetail } from "ynab";

import { Storage } from "@plasmohq/storage";

import type { BudgetNotificationSettings } from "./context/storageContext";
import type { CachedBudget } from "./context/ynabContext";
import {
  IS_DEV,
  ONE_DAY_IN_MILLIS,
  checkPermissions,
  formatCurrency,
  formatDateMonthAndDay,
  isEmptyObject
} from "./utils";

const notificationImage = new URL("../../assets/notification.png", import.meta.url);

export interface CurrentAlerts {
  [budgetId: string]: BudgetAlerts | undefined;
}

export interface BudgetAlerts {
  numImportedTxs?: number;
  accounts: AccountAlerts;
  cats: CategoryAlerts;
}

export interface AccountAlerts {
  [accountId: string]:
    | {
        name: string;
        importError?: boolean;
        reconcile?: boolean;
        lastReconciledAt?: string;
        numImportedTxs?: number;
      }
    | undefined;
}

export interface CategoryAlerts {
  [categoryId: string]:
    | {
        name: string;
        balance: number;
        overspent?: boolean;
      }
    | undefined;
}

/** Get the up-to-date alerts for the current budget, based on the given notification settings */
export const getBudgetAlerts = (
  notificationSettings: BudgetNotificationSettings,
  data: {
    importedTxs?: TransactionDetail[];
    accounts?: Account[];
    categories?: Category[];
  }
) => {
  const budgetAlerts: BudgetAlerts = {
    accounts: {},
    cats: {}
  };
  if (notificationSettings.checkImports)
    budgetAlerts.numImportedTxs = data.importedTxs?.length;

  data.accounts?.forEach((account) => {
    const accountAlerts: Pick<
      NonNullable<AccountAlerts[string]>,
      "importError" | "reconcile" | "numImportedTxs"
    > = {};

    // Check for number of unapproved transactions in this account
    if (notificationSettings.checkImports && data.importedTxs) {
      const numImportedTxsInAccount = data.importedTxs.filter(
        (tx) => tx.account_id === account.id
      ).length;
      if (numImportedTxsInAccount > 0)
        accountAlerts.numImportedTxs = numImportedTxsInAccount;
    }
    // Check for bank import error
    if (notificationSettings.importError && account.direct_import_in_error)
      accountAlerts.importError = true;

    // Check last time the account was reconciled
    const maxReconcileDays = notificationSettings.reconcileAlerts?.[account.id];
    if (
      maxReconcileDays &&
      account.last_reconciled_at &&
      Date.now() - new Date(account.last_reconciled_at).valueOf() >
        maxReconcileDays * ONE_DAY_IN_MILLIS
    )
      accountAlerts.reconcile = true;

    // Save all account alerts
    if (!isEmptyObject(accountAlerts)) {
      budgetAlerts.accounts[account.id] = {
        name: account.name,
        lastReconciledAt: account.last_reconciled_at || undefined,
        ...accountAlerts
      };
    }
  });

  data.categories?.forEach((category) => {
    const categoryAlerts: Pick<NonNullable<CategoryAlerts[string]>, "overspent"> = {};

    // Check for overspent
    if (notificationSettings.overspent && category.balance < 0)
      categoryAlerts.overspent = true;

    // Save all category alerts
    if (!isEmptyObject(categoryAlerts)) {
      budgetAlerts.cats[category.id] = {
        name: category.name,
        balance: category.balance,
        ...categoryAlerts
      };
    }
  });
  if (
    !budgetAlerts.numImportedTxs &&
    isEmptyObject(budgetAlerts.accounts) &&
    isEmptyObject(budgetAlerts.cats)
  )
    return null;
  else return budgetAlerts;
};

/** Count number of alerts for this budget */
export const getNumAlertsForBudget = (budgetAlerts: BudgetAlerts) =>
  budgetAlerts.numImportedTxs ||
  0 +
    Object.values(budgetAlerts.accounts || {}).reduce(
      (numAccountAlerts, accountAlerts) => {
        accountAlerts?.importError && (numAccountAlerts += 1);
        accountAlerts?.reconcile && (numAccountAlerts += 1);
        return numAccountAlerts;
      },
      0
    ) +
    Object.keys(budgetAlerts.cats || {}).length;

export const updateIconAndTooltip = (
  currentAlerts: CurrentAlerts,
  budgetsData: CachedBudget[]
) => {
  IS_DEV && console.log("Updating tooltip and icon");
  let tooltip = "";
  for (const [budgetId, budgetAlerts] of Object.entries(currentAlerts)) {
    const budget = budgetsData.find((b) => b.id === budgetId);
    if (!budget || !budgetAlerts) continue;

    tooltip += `----${budget.name}----\n`;

    if (budgetAlerts.numImportedTxs)
      tooltip += `${budgetAlerts.numImportedTxs} unapproved ${
        budgetAlerts.numImportedTxs === 1 ? "transaction" : "transactions"
      }!\n\n`;

    if (!isEmptyObject(budgetAlerts.cats)) {
      for (const categoryAlerts of Object.values(budgetAlerts.cats)) {
        if (!categoryAlerts) return;
        tooltip += `${categoryAlerts.name}: `;
        if (categoryAlerts.overspent)
          tooltip += formatCurrency(categoryAlerts.balance, budget.currencyFormat);
        tooltip += "\n";
      }
      tooltip += "\n";
    }

    if (!isEmptyObject(budgetAlerts.accounts)) {
      for (const accountAlerts of Object.values(budgetAlerts.accounts)) {
        if (accountAlerts?.importError || accountAlerts?.reconcile) {
          tooltip += `${accountAlerts.name}:\n`;
          if (accountAlerts.importError) tooltip += "Import issue\n";
          if (accountAlerts.reconcile && accountAlerts.lastReconciledAt)
            tooltip += `Last reconciled on ${formatDateMonthAndDay(new Date(accountAlerts.lastReconciledAt))}\n`;
          tooltip += "\n";
        }
      }
    }
  }
  if (tooltip.length > 600) tooltip = tooltip.slice(0, 600) + "\n...";

  const numNotifications = Object.keys(currentAlerts).reduce(
    (numAlerts, budgetId) =>
      numAlerts +
      (currentAlerts[budgetId] ? getNumAlertsForBudget(currentAlerts[budgetId]) : 0),
    0
  );

  chrome.action?.setTitle({ title: tooltip.trimEnd() });
  chrome.action?.setBadgeText({ text: String(numNotifications || "") });
};

const onNotificationClick = (id: string) => {
  chrome.notifications.clear(id);
  chrome.tabs.create({ url: `https://app.ynab.com/${id}/budget` });
};

export const createDesktopNotifications = async (
  currentAlerts: CurrentAlerts,
  budgetsData: CachedBudget[]
) => {
  const notifPermission = await checkPermissions(["notifications"]);
  if (!notifPermission) return;

  IS_DEV && console.log("Creating desktop notifications");
  chrome.notifications?.onClicked.removeListener(onNotificationClick);
  chrome.notifications?.onClicked.addListener(onNotificationClick);

  for (const [budgetId, budgetAlerts] of Object.entries(currentAlerts)) {
    const budget = budgetsData.find((b) => b.id === budgetId);
    if (!budget || !budgetAlerts) continue;

    const { numImportedTxs, accounts, cats } = budgetAlerts;
    const numImportError = Object.values(accounts).reduce(
      (acc, curr) => (curr?.importError ? acc + 1 : acc),
      0
    );
    const overspentCategories = Object.values(cats)
      .filter((c) => c?.overspent)
      .map((c) => c?.name)
      .join(", ");
    const accountsToReconcile = Object.values(accounts)
      .filter((a) => a?.reconcile)
      .map((a) => a?.name)
      .join(", ");

    let message = "";
    if (numImportedTxs)
      message += `${numImportedTxs} unapproved transaction${numImportedTxs > 1 ? "s" : ""}. `;
    if (numImportError)
      message += `${numImportError} import issue${numImportError > 1 ? "s" : ""}!`;
    if (message.length > 0) message += "\n";
    if (accountsToReconcile) message += `Reconcile: ${accountsToReconcile}\n`;
    if (overspentCategories) message += `Overspent: ${overspentCategories}\n`;
    message = message.trimEnd();

    if (!message) {
      chrome.notifications?.clear(budget.id);
      return;
    }

    const notificationOptions: chrome.notifications.NotificationOptions<true> = {
      iconUrl: notificationImage.toString(),
      title: budget.name,
      type: "basic",
      message,
      isClickable: true
    };

    chrome.notifications?.update(budget.id, notificationOptions, async (wasUpdated) => {
      const storage = new Storage({ area: "local" });
      const lastNotificationTime = await storage.get<number>(`lastNotif-${budgetId}`);

      // Create a new notification if there hasn't been one in last hour
      if (
        !wasUpdated &&
        (!lastNotificationTime || Date.now() - lastNotificationTime > 1000 * 60 * 60)
      ) {
        chrome.notifications?.create(budget.id, notificationOptions);
        storage.set(`lastNotif-${budgetId}`, Date.now());
      }
    });
  }
};
