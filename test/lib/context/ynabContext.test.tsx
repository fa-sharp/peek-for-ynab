import { renderHook, waitFor } from "@testing-library/react";
import type { RequestHandler } from "msw";
import { mockServer } from "test/mock/msw";
import { savedAccounts, savedCategories, validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { budgets } from "test/mock/ynabApiData";
import { expect, test } from "vitest";

import { useStorageContext, useYNABContext } from "~lib/context";

test("No data fetched if token is missing", async () => {
  const { result } = renderHook(useYNABContext, {
    wrapper: createTestAppWrapper()
  });
  await waitFor(() => expect(result.current.budgetsData).toBeFalsy());
  expect(result.current.categoryGroupsData).toBeFalsy();
  expect(result.current.accountsData).toBeFalsy();

  expect(mockServer.listHandlers().every((h) => !(h as RequestHandler).isUsed)).toBe(
    true
  );
});

test("Data fetched with valid token, and first budget auto-selected", async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });

  const { result } = renderHook(
    () => ({
      ynab: useYNABContext(),
      storage: useStorageContext()
    }),
    {
      wrapper: createTestAppWrapper()
    }
  );

  await waitFor(() => expect(result.current.ynab.budgetsData).toBeTruthy());
  expect(result.current.ynab.budgetsData).toHaveLength(2);
  expect(
    result.current.storage.popupState?.budgetId,
    "first budget is auto-selected"
  ).toBe(budgets[0].id);
});

test("Saved categories data loaded properly", async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken),
    cats: JSON.stringify(savedCategories)
  });

  const { result } = renderHook(useYNABContext, { wrapper: createTestAppWrapper() });
  await waitFor(() => expect(result.current.savedCategoriesData).toBeTruthy());

  expect(result.current.savedCategoriesData).toHaveLength(2);
  const groceriesCategory = result.current.savedCategoriesData?.find(
    (c) => c.id === "de6859dd-20ef-49db-85ce-762a58bb92b6"
  );
  expect(groceriesCategory).toBeTruthy();
  expect(groceriesCategory?.name).toBe("Groceries");
  expect(groceriesCategory?.balance).toBe(0);
});

test("Saved accounts data loaded properly", async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken),
    accounts: JSON.stringify(savedAccounts)
  });

  const { result } = renderHook(useYNABContext, { wrapper: createTestAppWrapper() });
  await waitFor(() => expect(result.current.savedAccountsData).toBeTruthy());

  expect(result.current.savedAccountsData).toHaveLength(1);
  const checkingAcct = result.current.savedAccountsData?.find(
    (a) => a.id === "b04cde9d-a0f7-4ed0-bf82-b44a3c4de92e"
  );
  expect(checkingAcct).toBeTruthy();
  expect(checkingAcct?.name).toBe("Checking");
  expect(checkingAcct?.balance).toBe(1000000);
});

test("Payee data loaded with transfer IDs included", async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });

  const { result } = renderHook(useYNABContext, { wrapper: createTestAppWrapper() });
  await waitFor(() => expect(result.current.payeesData).toBeTruthy());

  const checkingTransferPayee = result.current.payeesData?.find(
    (p) => p.id === "471ecaf5-5da8-49ce-9c99-06f45599d1a7"
  );
  expect(checkingTransferPayee).toBeTruthy();
  expect(checkingTransferPayee?.transferId).toBeTruthy();
});
