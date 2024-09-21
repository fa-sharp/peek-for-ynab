// @vitest-environment node
import { mockServer } from "test/mock/msw";
import { accounts, budgets, category_groups } from "test/mock/ynabApiData";
import { expect, test } from "vitest";
import { API } from "ynab";

import {
  fetchAccountsForBudget,
  fetchCategoryGroupsForBudget,
  mergeAccountsDataFromDelta,
  mergeCategoryGroupsDataFromDelta
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

const checkingAccountIdx = 1;
const checkingAccount = accounts[checkingAccountIdx];

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
