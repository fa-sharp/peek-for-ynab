// @vitest-environment node
import { randomUUID } from "crypto";
import { mockServer } from "test/mock/msw";
import { accounts, budgets, category_groups, payees } from "test/mock/ynabApiData";
import { expect, test } from "vitest";
import { API, type Account, type Category, type Payee } from "ynab";

import {
  fetchAccountsForBudget,
  fetchCategoryGroupsForBudget,
  fetchPayeesForBudget,
  formatPayee,
  mergeAccountsDataFromDelta,
  mergeCategoryGroupsDataFromDelta,
  mergePayeesDataFromDelta,
  payeeCollator
} from "~lib/api";

const frequentCategoryGroupIdx = 3;
const groceriesCategoryIdx = 0;
const groceriesCategory =
  category_groups[frequentCategoryGroupIdx].categories[groceriesCategoryIdx];
const frequentCategoryGroup = {
  id: category_groups[3].id,
  name: category_groups[3].name,
  hidden: category_groups[3].hidden,
  deleted: category_groups[3].deleted,
  categories: []
};

test("'mergeCategoryGroupsDataFromDelta' handles updated category balance", () => {
  const deltaResponse = [
    {
      ...frequentCategoryGroup,
      categories: [{ ...groceriesCategory, balance: 50_000 }]
    }
  ];
  expect(groceriesCategory.balance).toBe(0);
  const newData = mergeCategoryGroupsDataFromDelta(category_groups, deltaResponse);
  expect(newData.length).toEqual(category_groups.length);
  expect(newData[frequentCategoryGroupIdx].categories.length).toEqual(
    category_groups[frequentCategoryGroupIdx].categories.length
  );
  expect(
    newData[frequentCategoryGroupIdx].categories[groceriesCategoryIdx]
  ).toMatchObject({ ...groceriesCategory, balance: 50_000 });
});

test("'mergeCategoryGroupsDataFromDelta' handles new category", () => {
  const newCategory: Category = {
    id: randomUUID(),
    name: "Creative & Artsy Stuff",
    activity: 0,
    balance: 0,
    budgeted: 0,
    category_group_id: frequentCategoryGroup.id,
    hidden: false,
    deleted: false
  };
  const deltaResponse = [
    {
      ...frequentCategoryGroup,
      categories: [newCategory]
    }
  ];
  const newData = mergeCategoryGroupsDataFromDelta(category_groups, deltaResponse);
  expect(newData.length).toEqual(category_groups.length);
  expect(newData[frequentCategoryGroupIdx].categories.length).toEqual(
    category_groups[frequentCategoryGroupIdx].categories.length + 1
  );
  expect(newData[frequentCategoryGroupIdx].categories.at(-1)).toMatchObject(newCategory);
});

test("'mergeCategoryGroupsDataFromDelta' handles deleted category", () => {
  const deltaResponse = [
    {
      ...frequentCategoryGroup,
      categories: [{ ...groceriesCategory, deleted: true }]
    }
  ];
  const newData = mergeCategoryGroupsDataFromDelta(category_groups, deltaResponse);
  expect(newData[frequentCategoryGroupIdx].categories.length).toEqual(
    category_groups[frequentCategoryGroupIdx].categories.length - 1
  );
  expect(
    newData[frequentCategoryGroupIdx].categories.find(
      (c) => c.id === groceriesCategory.id
    )
  ).toBeUndefined();
});

test("'mergeCategoryGroupsDataFromDelta' handles deleted category group", () => {
  const deltaResponse = [
    {
      ...frequentCategoryGroup,
      deleted: true
    }
  ];
  const newData = mergeCategoryGroupsDataFromDelta(category_groups, deltaResponse);
  expect(newData.length).toEqual(category_groups.length - 1);
  expect(newData.find((cg) => cg.id === frequentCategoryGroup.id)).toBeUndefined();
});

const checkingAccountIdx = 1;
const checkingAccount = accounts[checkingAccountIdx];

test("'mergeAccountsFromDelta' handles updated account balance", () => {
  const deltaResponse = [
    {
      ...checkingAccount,
      balance: 1_500_000
    }
  ];
  expect(checkingAccount.balance).toBe(1_000_000);
  const newData = mergeAccountsDataFromDelta(accounts, deltaResponse);
  expect(newData.length).toEqual(accounts.length);
  expect(newData[checkingAccountIdx]).toMatchObject({
    ...checkingAccount,
    balance: 1_500_000
  });
});

test("'mergeAccountsFromDelta' handles new account", () => {
  const newAccount: Account = {
    id: randomUUID(),
    name: "Fancy Savings",
    type: "savings",
    balance: 0,
    uncleared_balance: 0,
    cleared_balance: 0,
    transfer_payee_id: randomUUID(),
    on_budget: true,
    closed: false,
    deleted: false
  };
  const newData = mergeAccountsDataFromDelta(accounts, [newAccount]);
  expect(newData.length).toEqual(accounts.length + 1);
  expect(newData.find((a) => a.id === newAccount.id)).toMatchObject(newAccount);
});

test("'mergeAccountsFromDelta' handles deleted account", () => {
  const deltaResponse = [
    {
      ...checkingAccount,
      deleted: true
    }
  ];
  const newData = mergeAccountsDataFromDelta(accounts, deltaResponse);
  expect(newData.length).toEqual(accounts.length - 1);
  expect(newData.find((a) => a.id === checkingAccount.id)).toBeUndefined();
});

const cachedPayees = payees
  .map(formatPayee)
  .sort((a, b) => payeeCollator.compare(a.name, b.name));
const abcPayee = payees.find((p) => p.name === "ABC Stores")!;

test("'mergePayeesFromDelta' handles and sorts new payee", () => {
  const newPayee = {
    id: randomUUID(),
    name: "BCD Stores",
    deleted: false
  };
  const newData = mergePayeesDataFromDelta(cachedPayees, [newPayee]);
  expect(newData.length).toEqual(cachedPayees.length + 1);
  expect(newData[1], "payee is inserted in sorted position").toMatchObject({
    id: newPayee.id,
    name: newPayee.name
  });
});

test("'mergePayeesFromDelta' handles updated payee", () => {
  const deltaResponse: Payee[] = [
    {
      ...abcPayee,
      name: "ABCD Stores",
      deleted: false
    }
  ];
  const newData = mergePayeesDataFromDelta(cachedPayees, deltaResponse);
  expect(newData.length).toEqual(cachedPayees.length);
  expect(newData[0]).toMatchObject({
    id: abcPayee.id,
    name: deltaResponse[0].name
  });
});

test("'mergeAccountsFromDelta' handles deleted payee", () => {
  const deltaResponse = [
    {
      ...abcPayee,
      deleted: true
    }
  ];
  const newData = mergePayeesDataFromDelta(cachedPayees, deltaResponse);
  expect(newData.length).toEqual(cachedPayees.length - 1);
  expect(newData.find((p) => p.id === abcPayee.id)).toBeUndefined();
});

test("'fetchCategoryGroups' uses delta request when cache exists", async () => {
  mockServer.events.on("request:start", ({ request }) => {
    expect(new URL(request.url).searchParams.get("last_knowledge_of_server")).toEqual(
      "1500"
    );
  });
  await fetchCategoryGroupsForBudget(new API("test"), budgets[0].id, {
    data: { categoryGroups: category_groups, serverKnowledge: 1500 },
    dataUpdatedAt: Date.now()
  });
  mockServer.events.removeAllListeners("request:start");
});

test("'fetchAccounts' uses delta request when cache exists", async () => {
  mockServer.events.on("request:start", ({ request }) => {
    expect(new URL(request.url).searchParams.get("last_knowledge_of_server")).toEqual(
      "2000"
    );
  });
  await fetchAccountsForBudget(new API("test"), budgets[0].id, {
    data: { accounts, serverKnowledge: 2000 },
    dataUpdatedAt: Date.now()
  });
  mockServer.events.removeAllListeners("request:start");
});

test("'fetchPayees' uses delta request when cache exists", async () => {
  mockServer.events.on("request:start", ({ request }) => {
    expect(new URL(request.url).searchParams.get("last_knowledge_of_server")).toEqual(
      "2500"
    );
  });
  await fetchPayeesForBudget(new API("test"), budgets[0].id, {
    data: { payees: cachedPayees, serverKnowledge: 2500 },
    dataUpdatedAt: Date.now()
  });
  mockServer.events.removeAllListeners("request:start");
});
