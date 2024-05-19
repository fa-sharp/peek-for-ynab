import type { Account, Category } from "ynab";

import { Storage } from "@plasmohq/storage";

import type { BudgetNotificationSettings } from "./context/storageContext";
import type { CachedBudget } from "./context/ynabContext";
import {
  IS_DEV,
  ONE_DAY_IN_MILLIS,
  checkPermissions,
  formatCurrency,
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

export const getBudgetAlerts = (
  notificationSettings: BudgetNotificationSettings,
  data: {
    importedTxs?: string[];
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
      "importError" | "reconcile"
    > = {};

    // Check for bank import error
    if (notificationSettings.importError && account.direct_import_in_error)
      accountAlerts.importError = true;

    // Check for last reconciled
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

export const updateIconTooltipWithAlerts = (
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
      tooltip += `${budgetAlerts.numImportedTxs} new ${
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
        if (!accountAlerts) return;
        tooltip += `${accountAlerts.name}:\n`;
        if (accountAlerts.importError) tooltip += "Connection issue\n";
        if (accountAlerts.reconcile && accountAlerts.lastReconciledAt)
          tooltip += `Last reconciled ${new Date(
            accountAlerts.lastReconciledAt
          ).toLocaleDateString()}\n`;
        tooltip += "\n";
      }
    }
  }
  if (tooltip.length > 600) tooltip = tooltip.slice(0, 600) + "\n...";

  chrome.action?.setTitle({ title: tooltip.trimEnd() });
  chrome.action?.setBadgeText({
    text: String(
      Object.keys(currentAlerts).reduce(
        (numAlerts, budgetId) =>
          numAlerts +
          (currentAlerts[budgetId]?.numImportedTxs || 0) +
          Object.keys(currentAlerts[budgetId]?.accounts || {}).length +
          Object.keys(currentAlerts[budgetId]?.cats || {}).length,
        0
      ) || ""
    )
  });
};

const NOTIFICATION_ID = "peek";
const onNotificationClick = (id: string) => {
  if (id === NOTIFICATION_ID) {
    chrome.notifications.clear(NOTIFICATION_ID);
    chrome.tabs.create({ url: "https://app.ynab.com" });
  }
};

export const createRichNotification = async (
  currentAlerts: CurrentAlerts,
  budgetsData: CachedBudget[]
) => {
  const notifPermission = await checkPermissions(["notifications"]);
  if (!notifPermission) return;

  IS_DEV && console.log("Creating rich notification");

  let message = "";
  for (const [budgetId, budgetAlerts] of Object.entries(currentAlerts)) {
    const budget = budgetsData.find((b) => b.id === budgetId);
    if (!budget || !budgetAlerts) continue;

    const { numImportedTxs, accounts, cats } = budgetAlerts;
    const numOverspent = Object.values(cats).reduce(
      (acc, curr) => (curr?.overspent ? acc + 1 : acc),
      0
    );
    const numToReconcile = Object.values(accounts).reduce(
      (acc, curr) => (curr?.reconcile ? acc + 1 : acc),
      0
    );
    const numImportError = Object.values(accounts).reduce(
      (acc, curr) => (curr?.importError ? acc + 1 : acc),
      0
    );

    message += `${budget.name}: `;
    if (numImportedTxs) message += `${numImportedTxs} new transactions. `;
    if (numOverspent) message += `${numOverspent} overspent categories. `;
    if (numToReconcile) message += `${numToReconcile} accounts to reconcile. `;
    if (numImportError) message += `${numImportError} import errors!`;
    message += "\n\n";
  }
  message = message.trimEnd();
  if (!message) return;

  chrome.notifications?.onButtonClicked.removeListener(onNotificationClick);
  chrome.notifications?.onButtonClicked.addListener(onNotificationClick);
  chrome.notifications?.onClicked.removeListener(onNotificationClick);
  chrome.notifications?.onClicked.addListener(onNotificationClick);

  const notificationOptions: chrome.notifications.NotificationOptions<true> = {
    iconUrl: notificationImage.toString(),
    title: "Peek for YNAB",
    type: "basic",
    message,
    isClickable: true,
    buttons: [{ title: "Open YNAB" }]
  };

  chrome.notifications?.update(
    NOTIFICATION_ID,
    notificationOptions,
    async (wasUpdated) => {
      const storage = new Storage({ area: "local" });
      const lastNotificationTime = await storage.get<number>("lastRichNotification");
      storage.set("lastRichNotification", Date.now());

      // Create a new notification, unless one was created in last hour
      if (!wasUpdated) {
        if (lastNotificationTime && Date.now() - lastNotificationTime < 1000 * 60 * 60)
          return;
        chrome.notifications?.create(NOTIFICATION_ID, notificationOptions);
      }
    }
  );
};
