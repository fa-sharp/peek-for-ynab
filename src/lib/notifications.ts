import type { Account, Category, TransactionDetail } from "ynab";

import { IS_DEV, ONE_DAY_IN_MILLIS } from "./constants";
import type { BudgetNotificationSettings, CachedBudget } from "./types";
import { formatCurrency, formatDateMonthAndDay, isEmptyObject } from "./utils";

const notificationImage = new URL("../../assets/notification.png", import.meta.url);

export interface CurrentAlerts {
  [budgetId: string]: BudgetAlerts | undefined;
}

export interface BudgetAlerts {
  numUnapprovedTxs?: number;
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
        numUnapprovedTxs?: number;
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
    unapprovedTxs?: TransactionDetail[];
    accounts?: Account[];
    categories?: Category[];
  }
) => {
  const budgetAlerts: BudgetAlerts = {
    accounts: {},
    cats: {}
  };
  if (notificationSettings.checkImports)
    budgetAlerts.numUnapprovedTxs = data.unapprovedTxs?.length;

  data.accounts?.forEach((account) => {
    const accountAlerts: Pick<
      NonNullable<AccountAlerts[string]>,
      "importError" | "reconcile" | "numUnapprovedTxs"
    > = {};

    // Check for number of unapproved transactions in this account
    if (notificationSettings.checkImports && data.unapprovedTxs) {
      const numUnapprovedTxsInAccount = data.unapprovedTxs.filter(
        (tx) => tx.account_id === account.id
      ).length;
      if (numUnapprovedTxsInAccount > 0)
        accountAlerts.numUnapprovedTxs = numUnapprovedTxsInAccount;
    }
    // Check for bank import error
    if (notificationSettings.importError && account.direct_import_in_error)
      accountAlerts.importError = true;

    // Check last day the account was reconciled
    const maxReconcileDays = notificationSettings.reconcileAlerts?.[account.id];
    if (maxReconcileDays && account.last_reconciled_at) {
      const lastReconciledAt = new Date(account.last_reconciled_at);
      lastReconciledAt.setHours(3, 0, 0, 0); // set to 3 AM to avoid notifications at midnight
      const today = new Date();
      const daysPassed = Math.floor(
        (today.valueOf() - lastReconciledAt.valueOf()) / ONE_DAY_IN_MILLIS
      );

      if (daysPassed >= maxReconcileDays) {
        accountAlerts.reconcile = true;
      }
    }

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
    !budgetAlerts.numUnapprovedTxs &&
    isEmptyObject(budgetAlerts.accounts) &&
    isEmptyObject(budgetAlerts.cats)
  )
    return null;
  else return budgetAlerts;
};

/** Count number of alerts for this budget */
export const getNumAlertsForBudget = (budgetAlerts: BudgetAlerts) =>
  (budgetAlerts.numUnapprovedTxs ?? 0) +
  Object.values(budgetAlerts.accounts).reduce((numAccountAlerts, accountAlerts) => {
    accountAlerts?.importError && (numAccountAlerts += 1);
    accountAlerts?.reconcile && (numAccountAlerts += 1);
    return numAccountAlerts;
  }, 0) +
  Object.keys(budgetAlerts.cats).length;

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

    if (budgetAlerts.numUnapprovedTxs)
      tooltip += `${budgetAlerts.numUnapprovedTxs} unapproved ${
        budgetAlerts.numUnapprovedTxs === 1 ? "transaction" : "transactions"
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
  chrome.action?.setBadgeTextColor({ color: "#000" });
  chrome.action?.setBadgeBackgroundColor({ color: "#9dc9e7" });
};

export const createSystemNotification = async (
  budgetAlerts: BudgetAlerts,
  budgetData: CachedBudget
) => {
  IS_DEV && console.log("Creating system notification for budget: ", budgetData);

  const { numUnapprovedTxs, accounts, cats } = budgetAlerts;
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
  if (numUnapprovedTxs)
    message += `${numUnapprovedTxs} unapproved transaction${numUnapprovedTxs > 1 ? "s" : ""}. `;
  if (numImportError)
    message += `${numImportError} import issue${numImportError > 1 ? "s" : ""}!`;
  if (message.length > 0) message += "\n";
  if (accountsToReconcile) message += `Reconcile: ${accountsToReconcile}\n`;
  if (overspentCategories) message += `Overspent: ${overspentCategories}\n`;
  message = message.trimEnd();

  if (!message) {
    chrome.notifications?.clear(budgetData.id);
  } else {
    chrome.notifications?.create(budgetData.id, {
      iconUrl: notificationImage.toString(),
      title: budgetData.name,
      type: "basic",
      message,
      isClickable: true
    });
  }

  return message;
};
