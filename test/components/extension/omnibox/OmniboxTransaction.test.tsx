import { render, renderHook, waitFor } from "@testing-library/react";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { accounts, category_groups, payees } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import OmniboxTransaction from "~components/extension/omnibox/OmniboxTransaction";
import { useYNABContext } from "~lib/context";
import { parseTxInput } from "~lib/omnibox";
import useTransaction from "~lib/useTransaction";

const abcPayee = payees.find((p) => p.name === "ABC Stores")!;
const groceriesCategory = category_groups[3].categories[0];
const amexAccount = accounts[3];

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("updates the form state for each field", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(
    () => ({ ynab: useYNABContext(), tx: useTransaction() }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());

  const parsedQuery = parseTxInput("add 142.42 at abc for grocer on amex");

  const { rerender } = render(
    <OmniboxTransaction
      budget={result.current.ynab.selectedBudgetData!}
      budgetMainData={result.current.ynab.budgetMainData!}
      formState={result.current.tx.formState}
      handlers={result.current.tx.handlers}
      isSaving={result.current.tx.isSaving}
      parsedQuery={parsedQuery!}
      openTxForm={() => {}}
    />
  );

  expect(result.current.tx.formState.amount).toBe("142.42");
  expect(result.current.tx.formState.payee).toMatchObject({ id: abcPayee.id });
  expect(result.current.tx.formState.category).toMatchObject(groceriesCategory);
  expect(result.current.tx.formState.account).toMatchObject(amexAccount);

  const newParsedQuery = parseTxInput("add 42.96 on amex memo lorem ipsum");
  rerender(
    <OmniboxTransaction
      budget={result.current.ynab.selectedBudgetData!}
      budgetMainData={result.current.ynab.budgetMainData!}
      formState={result.current.tx.formState}
      handlers={result.current.tx.handlers}
      isSaving={result.current.tx.isSaving}
      parsedQuery={newParsedQuery!}
      openTxForm={() => {}}
    />
  );
  expect(result.current.tx.formState.amount).toBe("42.96");
  expect(result.current.tx.formState.payee).toBeNull();
  expect(result.current.tx.formState.category).toBeNull();
  expect(result.current.tx.formState.account).toMatchObject(amexAccount);
  expect(result.current.tx.formState.memo.trim()).toBe("lorem ipsum");
});
