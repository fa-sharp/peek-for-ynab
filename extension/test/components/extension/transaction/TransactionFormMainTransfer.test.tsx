import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { RefObject } from "react";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import TransactionFormMainTransfer from "~components/extension/transaction/TransactionFormMainTransfer";
import { useYNABContext } from "~lib/context";
import { authTokenStorage, txStore } from "~lib/state";
import useTransaction from "~lib/useTransaction";
import { mockAuthToken } from "~test/mock/userData";
import { createTestAppWrapper } from "~test/mock/wrapper";
import { accounts } from "~test/mock/ynabApiData";

const checkingAccount = accounts.find((a) => a.name === "Checking")!;
const savingsAccount = accounts.find((a) => a.name === "Savings")!;

beforeEach(async () => {
  await authTokenStorage.setValue(mockAuthToken);
});

test("Transfer form has expected keyboard tab order", async () => {
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
      <TransactionFormMainTransfer
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
  expect(screen.getByRole("combobox", { name: "Payee (To)" })).toHaveFocus();
  await user.keyboard("{Tab}");
  expect(screen.getByRole("combobox", { name: "Account (From)" })).toHaveFocus();
  await user.keyboard("{Tab}");
  expect(memoRef.current).toHaveFocus();
});

test("Proper transfer payee and account state when filling out the form", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = await act(() =>
    renderHook(() => ({ ynab: useYNABContext(), transaction: useTransaction() }), {
      wrapper,
    })
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const user = userEvent.setup();
  render(
    <TransactionFormMainTransfer
      dispatch={result.current.transaction.dispatch}
      budgetMainData={result.current.ynab.budgetMainData!}
      isSaving={false}
    />,
    { wrapper }
  );

  expect(txStore.getState().accountId).toBeUndefined();

  (await screen.findByRole("combobox", { name: "Payee (To)" })).focus();
  await user.keyboard("{ArrowDown}{Enter}");

  expect(txStore.getState()).toMatchObject({
    payee: { id: checkingAccount.transfer_payee_id, name: checkingAccount.name },
  });

  screen.getByRole("combobox", { name: "Account (From)" }).focus();
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

  expect(txStore.getState()).toMatchObject({
    payee: { id: checkingAccount.transfer_payee_id, name: checkingAccount.name },
    accountId: savingsAccount.id,
  });
});
