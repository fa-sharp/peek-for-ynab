// @vitest-environment node
import { randomUUID } from "crypto";
import { accounts, budgets, category_groups } from "test/mock/ynabApiData";
import { expect, test } from "vitest";

import {
  type BudgetAlerts,
  createSystemNotification,
  getBudgetAlerts,
  getNumAlertsForBudget
} from "~lib/notifications";

test("'getBudgetAlerts' returns expected object", () => {
  expect(
    getBudgetAlerts(
      {
        overspent: true,
        checkImports: false,
        importError: false,
        reconcileAlerts: {
          [accounts[0].id]: 7
        }
      },
      { accounts }
    )
  ).toMatchObject({
    accounts: { [accounts[0].id]: { name: accounts[0].name, reconcile: true } },
    cats: {}
  } satisfies BudgetAlerts);

  expect(
    getBudgetAlerts(
      {
        overspent: true,
        checkImports: false,
        importError: false,
        reconcileAlerts: {
          [accounts[0].id]: 7
        }
      },
      { accounts, categories: category_groups.flatMap((cg) => cg.categories) }
    )
  ).toMatchObject({
    accounts: { [accounts[0].id]: { name: accounts[0].name, reconcile: true } },
    cats: {
      "4854168f-c898-4b5c-8e19-18a76c6cc436": {
        name: "Eating Out",
        balance: -50_000,
        overspent: true
      }
    }
  } satisfies BudgetAlerts);
});

test("'getNumAlertsForBudget' returns expected number", () => {
  expect(
    getNumAlertsForBudget({
      accounts: {},
      cats: {}
    })
  ).toBe(0);

  expect(
    getNumAlertsForBudget({
      accounts: {},
      cats: {},
      numUnapprovedTxs: 1
    })
  ).toBe(1);

  expect(
    getNumAlertsForBudget({
      accounts: {
        [randomUUID()]: { name: "Checking", importError: true, reconcile: true }
      },
      cats: { [randomUUID()]: { name: "Groceries", balance: -10_000, overspent: true } },
      numUnapprovedTxs: 3
    })
  ).toBe(6);
});

test("'createSystemNotification' doesn't create an empty notification", async () => {
  const budget = budgets[0];
  const notificationText = await createSystemNotification(
    {
      accounts: {},
      cats: {},
      numUnapprovedTxs: 0
    },
    {
      id: budget.id,
      name: budget.name,
      currencyFormat: budget.currency_format
    }
  );

  expect(notificationText).toBe("");
  expect(chrome.notifications.create).toHaveBeenCalledTimes(0);
});

test("'createSystemNotification' creates expected notification", async () => {
  const budget = budgets[0];
  const notificationText = await createSystemNotification(
    {
      accounts: {
        [randomUUID()]: { name: "Checking", reconcile: true }
      },
      cats: {
        [randomUUID()]: { name: "Groceries", balance: -10_000, overspent: true }
      },
      numUnapprovedTxs: 1
    },
    {
      id: budget.id,
      name: budget.name,
      currencyFormat: budget.currency_format
    }
  );

  expect(notificationText).toContain("1 unapproved transaction");
  expect(notificationText).toContain("Reconcile: Checking");
  expect(notificationText).toContain("Overspent: Groceries");
  expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
});
