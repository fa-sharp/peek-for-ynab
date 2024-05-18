import type { QueryClient } from "@tanstack/react-query";
import type { Account, Category, CategoryGroupWithCategories } from "ynab";

import type { BudgetNotificationSettings } from "./context/storageContext";
import type { CachedBudget } from "./context/ynabContext";
import { ONE_DAY_IN_MILLIS, formatCurrency, isEmptyObject } from "./utils";

export interface CurrentAlerts {
  [budgetId: string]: BudgetAlerts | undefined;
}

export interface BudgetAlerts {
  accounts: AccountAlerts;
  cats: CategoryAlerts;
}

export interface AccountAlerts {
  [accountId: string]:
    | {
        importError?: boolean;
        reconcile?: boolean;
      }
    | undefined;
}

export interface CategoryAlerts {
  [categoryId: string]:
    | {
        overspent?: boolean;
      }
    | undefined;
}

export const getBudgetAlerts = (
  notificationSettings: BudgetNotificationSettings,
  data: {
    accounts?: Account[];
    categories?: Category[];
  }
) => {
  const budgetAlerts: BudgetAlerts = {
    accounts: {},
    cats: {}
  };
  data.accounts?.forEach((account) => {
    const accountAlerts: AccountAlerts[string] = {};

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

    if (!isEmptyObject(accountAlerts)) budgetAlerts.accounts[account.id] = accountAlerts;
  });
  data.categories?.forEach((category) => {
    const categoryAlerts: CategoryAlerts[string] = {};

    // Check for overspent
    if (notificationSettings.overspent && category.balance < 0)
      categoryAlerts.overspent = true;

    if (!isEmptyObject(categoryAlerts)) budgetAlerts.cats[category.id] = categoryAlerts;
  });
  return isEmptyObject(budgetAlerts.accounts) && isEmptyObject(budgetAlerts.cats)
    ? null
    : budgetAlerts;
};

export const updateIconTooltipWithAlerts = (
  currentAlerts: CurrentAlerts,
  queryClient: QueryClient
) => {
  const budgetsData = queryClient.getQueryData<CachedBudget[]>(["budgets"]);
  if (!budgetsData) {
    console.log("Can't update tooltip and icon - no budgets data found in cache");
    return;
  } else {
    console.log("Updating tooltip and icon");
  }
  let tooltip = "";
  for (const [budgetId, budgetAlerts] of Object.entries(currentAlerts)) {
    const budget = budgetsData.find((b) => b.id === budgetId);
    if (!budget || !budgetAlerts) continue;

    tooltip += `----${budget.name}----\n`;
    if (!isEmptyObject(budgetAlerts.cats)) {
      const categoriesData = queryClient
        .getQueryData<CategoryGroupWithCategories[]>(["categoryGroups", { budgetId }])
        ?.flatMap((cg) => cg.categories);
      for (const [categoryId, categoryAlerts] of Object.entries(budgetAlerts.cats)) {
        const category = categoriesData?.find((c) => c.id === categoryId);
        if (!category) continue;

        tooltip += `${category.name}: `;
        if (categoryAlerts?.overspent)
          tooltip += formatCurrency(category.balance, budget.currencyFormat);

        tooltip += "\n";
      }
      tooltip += "\n";
    }
    if (!isEmptyObject(budgetAlerts.accounts)) {
      const accountsData = queryClient.getQueryData<Account[]>([
        "accounts",
        { budgetId }
      ]);
      for (const [accountId, accountAlerts] of Object.entries(budgetAlerts.accounts)) {
        const account = accountsData?.find((a) => a.id === accountId);
        if (!account) continue;

        tooltip += `${account.name}:\n`;
        if (accountAlerts?.importError) tooltip += "Connection issue\n";
        if (accountAlerts?.reconcile && account.last_reconciled_at)
          tooltip += `Last reconciled ${new Date(
            account.last_reconciled_at
          ).toLocaleDateString()}\n`;

        tooltip += "\n";
      }
    }
  }
  chrome.action.setTitle({ title: tooltip });
  chrome.action.setBadgeText({
    text: String(
      Object.keys(currentAlerts).reduce(
        (numAlerts, budgetId) =>
          numAlerts +
          Object.keys(currentAlerts[budgetId]?.accounts || {}).length +
          Object.keys(currentAlerts[budgetId]?.cats || {}).length,
        0
      ) || ""
    )
  });
};
