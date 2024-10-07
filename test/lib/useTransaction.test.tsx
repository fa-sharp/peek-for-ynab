import { renderHook, waitFor } from "@testing-library/react";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { accounts } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { useStorageContext, useYNABContext } from "~lib/context";
import type { TxAddInitialState } from "~lib/types";
import useTransaction from "~lib/useTransaction";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

const checkingAccount = accounts.find((a) => a.name === "Checking")!;

test("persists form state to extension storage", async () => {
  const wrapper = createTestAppWrapper();

  const { result, rerender } = renderHook(
    () => ({
      tx: useTransaction(),
      storage: useStorageContext(),
      ynab: useYNABContext()
    }),
    {
      wrapper
    }
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());
  rerender();

  result.current.tx.handlers.setAmount("123.45");
  result.current.tx.handlers.setAccount(checkingAccount);
  result.current.tx.handlers.setFlag("orange");

  await waitFor(async () =>
    expect(result.current.storage.txState).toMatchObject({
      amount: "123.45",
      accountId: checkingAccount.id,
      flag: "orange"
    } satisfies TxAddInitialState)
  );
  await waitFor(async () =>
    expect(JSON.parse((await chrome.storage.local.get("txState")).txState)).toMatchObject(
      {
        amount: "123.45",
        accountId: checkingAccount.id,
        flag: "orange"
      } satisfies TxAddInitialState
    )
  );
});
