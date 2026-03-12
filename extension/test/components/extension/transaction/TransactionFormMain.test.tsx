import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { RefObject } from "react";
import { beforeEach, expect, test } from "vitest";

import "vitest-dom/extend-expect";

import TransactionFormMain from "~components/extension/transaction/TransactionFormMain";
import { useYNABContext } from "~lib/context";
import { authTokenStorage, txStore } from "~lib/state";
import useTransaction from "~lib/useTransaction";
import { mockAuthToken } from "~test/mock/userData";
import { createTestAppWrapper } from "~test/mock/wrapper";
import { accounts, category_groups } from "~test/mock/ynabApiData";

const checkingAccount = accounts.find((a) => a.name === "Checking")!;
const readyToAssignCategory = category_groups[0].categories.find(
  (c) => c.name === "Inflow: Ready to Assign"
)!;

beforeEach(async () => {
  await authTokenStorage.setValue(mockAuthToken);
});

test("Form has expected keyboard tab order", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = await act(() =>
    renderHook(() => ({ ynab: useYNABContext(), transaction: useTransaction() }), {
      wrapper,
    })
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const memoRef: RefObject<HTMLInputElement | null> = { current: null };
  const user = userEvent.setup();
  render(
    <>
      <TransactionFormMain
        dispatch={result.current.transaction.dispatch}
        memoRef={memoRef}
        budgetMainData={result.current.ynab.budgetMainData!}
        isSaving={false}
      />
      <input ref={memoRef} />
    </>,
    { wrapper }
  );

  await user.keyboard("{Tab}");
  expect(screen.getByRole("combobox", { name: "Payee" })).toHaveFocus();
  await user.keyboard("{Tab}");
  expect(screen.getByRole("combobox", { name: "Category" })).toHaveFocus();
  await user.keyboard("{Tab}");
  expect(screen.getByRole("combobox", { name: "Account" })).toHaveFocus();
  await user.keyboard("{Tab}");
  expect(memoRef.current).toHaveFocus();
});

test("State is successfully updated when filling out the form", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = await act(() =>
    renderHook(() => ({ ynab: useYNABContext(), transaction: useTransaction() }), {
      wrapper,
    })
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const user = userEvent.setup();
  render(
    <TransactionFormMain
      dispatch={result.current.transaction.dispatch}
      budgetMainData={result.current.ynab.budgetMainData!}
      isSaving={false}
    />,
    { wrapper }
  );

  expect(txStore.getState().accountId).toBeUndefined();

  const categoryField = await screen.findByRole("combobox", { name: "Category" });
  categoryField.focus();
  await user.keyboard("{ArrowDown}{Enter}");

  expect(txStore.getState()).toMatchObject({
    categoryId: readyToAssignCategory.id,
  });

  screen.getByRole("combobox", { name: "Account" }).focus();
  await user.keyboard("{ArrowDown}{Enter}");

  expect(txStore.getState()).toMatchObject({
    categoryId: readyToAssignCategory.id,
    accountId: checkingAccount.id,
  });
});
