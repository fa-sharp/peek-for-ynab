import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { RefObject } from "react";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { accounts } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import TransactionFormMainTransfer from "~components/extension/transaction/TransactionFormMainTransfer";
import { useYNABContext } from "~lib/context";
import useTransaction from "~lib/useTransaction";

const checkingAccount = accounts.find((a) => a.name === "Checking")!;
const savingsAccount = accounts.find((a) => a.name === "Savings")!;

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Transfer form has expected keyboard tab order", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(
    () => ({ ynab: useYNABContext(), transaction: useTransaction() }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const memoRef: RefObject<HTMLInputElement> = { current: null };
  const user = userEvent.setup();
  render(
    <>
      <TransactionFormMainTransfer
        formState={result.current.transaction.formState}
        handlers={result.current.transaction.handlers}
        memoRef={memoRef}
        budgetMainData={result.current.ynab.budgetMainData!}
        isBudgetToTrackingTransfer={
          result.current.transaction.derivedState.isBudgetToTrackingTransfer
        }
        totalSubTxsAmount={result.current.transaction.derivedState.totalSubTxsAmount}
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

  const { result } = renderHook(
    () => ({ ynab: useYNABContext(), transaction: useTransaction() }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const user = userEvent.setup();
  render(
    <TransactionFormMainTransfer
      formState={result.current.transaction.formState}
      handlers={result.current.transaction.handlers}
      budgetMainData={result.current.ynab.budgetMainData!}
      isBudgetToTrackingTransfer={
        result.current.transaction.derivedState.isBudgetToTrackingTransfer
      }
      totalSubTxsAmount={result.current.transaction.derivedState.totalSubTxsAmount}
      isSaving={false}
    />,
    { wrapper }
  );

  expect(result.current.transaction.formState.account).toBeNull();

  screen.getByRole("combobox", { name: "Payee (To)" }).focus();
  await user.keyboard("{ArrowDown}{Enter}");

  expect(result.current.transaction.formState).toMatchObject({
    payee: { id: checkingAccount.transfer_payee_id, name: checkingAccount.name },
    category: null,
    account: null
  });

  screen.getByRole("combobox", { name: "Account (From)" }).focus();
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

  expect(result.current.transaction.formState).toMatchObject({
    payee: { id: checkingAccount.transfer_payee_id, name: checkingAccount.name },
    category: null,
    account: savingsAccount
  });
});
