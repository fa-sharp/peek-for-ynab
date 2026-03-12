import { act, render, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import OmniboxTransaction from "~components/extension/omnibox/OmniboxTransaction";
import { useYNABContext } from "~lib/context";
import { parseTxInput } from "~lib/omnibox";
import { authTokenStorage, txStore } from "~lib/state";
import useTransaction from "~lib/useTransaction";
import { mockAuthToken } from "~test/mock/userData";
import { createTestAppWrapper } from "~test/mock/wrapper";
import { accounts, category_groups, payees } from "~test/mock/ynabApiData";

const abcPayee = payees.find((p) => p.name === "ABC Stores")!;
const groceriesCategory = category_groups[3].categories[0];
const amexAccount = accounts[3];

beforeEach(async () => {
  await authTokenStorage.setValue(mockAuthToken);
});

// FIXME doesn't work right now, probably related to https://github.com/testing-library/react-testing-library/pull/1214
test("updates the form state for each field", async () => {
  const wrapper = createTestAppWrapper();
  const { result: ynab } = await act(() =>
    renderHook(useYNABContext, {
      wrapper,
    })
  );
  await waitFor(() => expect(ynab.current.budgetMainData).toBeTruthy());

  const { result: tx } = renderHook(useTransaction, {
    wrapper,
  });
  await waitFor(() => expect(tx.current).toBeTruthy());

  const parsedQuery = parseTxInput("add 142.42 at abc for grocer on amex");

  const { rerender } = render(
    <OmniboxTransaction
      budget={ynab.current.selectedBudgetData!}
      budgetMainData={ynab.current.budgetMainData!}
      dispatch={tx.current.dispatch}
      isSaving={tx.current.isSaving}
      parsedQuery={parsedQuery!}
      openTxForm={() => undefined}
    />
  );

  let txState = txStore.getState();
  expect(txState.amount).toBe("142.42");
  expect(txState.payee).toMatchObject({ id: abcPayee.id });
  expect(txState.categoryId).toEqual(groceriesCategory.id);
  expect(txState.accountId).toEqual(amexAccount.id);

  const newParsedQuery = parseTxInput("add 42.96 on amex memo lorem ipsum");
  rerender(
    <OmniboxTransaction
      budget={ynab.current.selectedBudgetData!}
      budgetMainData={ynab.current.budgetMainData!}
      dispatch={tx.current.dispatch}
      isSaving={tx.current.isSaving}
      parsedQuery={newParsedQuery!}
      openTxForm={() => undefined}
    />
  );
  txState = txStore.getState();
  expect(txState.amount).toBe("42.96");
  expect(txState.payee).toBeNull();
  expect(txState.categoryId).toBeNull();
  expect(txState.accountId).toEqual(amexAccount.id);
  expect(txState.memo?.trim()).toBe("lorem ipsum");
});
