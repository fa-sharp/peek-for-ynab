import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { RefObject } from "react";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { accounts } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import TransactionFormMain from "~components/extension/transaction/TransactionFormMain";
import { useYNABContext } from "~lib/context";
import useTransaction from "~lib/useTransaction";

const checkingAccount = accounts.find((a) => a.name === "Checking")!;

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Form has expected keyboard tab order", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(
    () => ({ ynab: useYNABContext(), transaction: useTransaction() }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const memoRef: RefObject<HTMLInputElement | null> = { current: null };
  const user = userEvent.setup();
  render(
    <>
      <TransactionFormMain
        formState={result.current.transaction.formState}
        handlers={result.current.transaction.handlers}
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

  const { result } = renderHook(
    () => ({ ynab: useYNABContext(), transaction: useTransaction() }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const user = userEvent.setup();
  render(
    <TransactionFormMain
      formState={result.current.transaction.formState}
      handlers={result.current.transaction.handlers}
      budgetMainData={result.current.ynab.budgetMainData!}
      isSaving={false}
    />,
    { wrapper }
  );

  expect(result.current.transaction.formState.account).toBeNull();

  screen.getByRole("combobox", { name: "Category" }).focus();
  await user.keyboard("{ArrowDown}{Enter}");

  expect(result.current.transaction.formState).toMatchObject({
    category: { name: "Inflow: Ready to Assign" },
    account: null
  });

  screen.getByRole("combobox", { name: "Account" }).focus();
  await user.keyboard("{ArrowDown}{Enter}");

  expect(result.current.transaction.formState).toMatchObject({
    category: { name: "Inflow: Ready to Assign" },
    account: checkingAccount
  });
});
