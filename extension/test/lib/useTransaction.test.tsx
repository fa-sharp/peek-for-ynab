import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import { createTestAppWrapper } from "~test/mock/wrapper";
import { accounts } from "~test/mock/ynabApiData";
import "vitest-dom/extend-expect";

import { storage } from "#imports";
import { useStorageContext, useYNABContext } from "~lib/context";
import { authTokenStorage, txStore } from "~lib/state";
import type { TxAddState } from "~lib/types";
import useTransaction from "~lib/useTransaction";
import { mockAuthToken } from "~test/mock/userData";

beforeEach(async () => {
  await authTokenStorage.setValue(mockAuthToken);
});

const checkingAccount = accounts.find((a) => a.name === "Checking")!;

test("persists form state to extension storage", async () => {
  const wrapper = createTestAppWrapper();

  const { result, rerender } = await act(() =>
    renderHook(
      () => ({
        tx: useTransaction(),
        storage: useStorageContext(),
        ynab: useYNABContext(),
      }),
      { wrapper }
    )
  );
  await waitFor(() => expect(result.current.ynab.budgetMainData).toBeTruthy());
  rerender();

  result.current.tx.dispatch({ type: "setAmount", amount: "123.45" });
  result.current.tx.dispatch({ type: "setAccount", accountId: checkingAccount.id });
  result.current.tx.dispatch({ type: "setFlag", flag: "orange" });

  expect(txStore.getState()).toMatchObject({
    amount: "123.45",
    accountId: checkingAccount.id,
    flag: "orange",
  } satisfies TxAddState);
  expect(JSON.parse((await storage.getItem("local:txState"))!)).toMatchObject({
    state: {
      amount: "123.45",
      accountId: checkingAccount.id,
      flag: "orange",
    } satisfies TxAddState,
  });
});
