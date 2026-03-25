import { type SubmitEventHandler, useCallback, useEffect, useRef, useState } from "react";

import type { TransactionFlagColor } from "~lib/api/client";
import { useStorageContext, useYNABContext } from "./context";
import { type TxStoreAction, txStore, useTxStore, useTxStoreSubTxTotals } from "./state";
import {
  executeScriptInCurrentTab,
  isBudgetToTrackingTransfer,
  parseLocaleNumber,
  stringValueToMillis,
} from "./utils";

export type TransactionFormDispatch = ReturnType<typeof useTransaction>["dispatch"];

/** Utility hook for transaction form logic */
export default function useTransaction() {
  const { accountsData, categoriesData, addTransaction } = useYNABContext();
  const {
    popupState,
    setPopupState,
    settings,
    budgetSettings,
    setOmniboxInput,
    setBudgetSettings,
  } = useStorageContext();

  const dispatchTxState = useTxStore((s) => s.dispatch);
  const resetTxForm = useTxStore((s) => s.reset);
  const returnTo = useTxStore((s) => s.returnTo);

  /** Cancel adding transaction and return to previous page */
  const onCancelTransaction = useCallback(() => {
    setPopupState(returnTo ?? { view: "main" });
  }, [setPopupState, returnTo]);

  // Try parsing user's current selection as the initial amount
  useParseAmountFromUserSelection(!!settings.currentTabAccess, dispatchTxState);

  // Reset form state if switching budgets
  const originalBudgetId = useRef(popupState.budgetId);
  useEffect(() => {
    if (popupState.budgetId !== originalBudgetId.current) {
      resetTxForm();
      originalBudgetId.current = popupState.budgetId;
    }
  }, [popupState.budgetId, resetTxForm]);

  const [isSaving, setIsSaving] = useState(false);
  const { leftOverSubTxsAmount } = useTxStoreSubTxTotals();

  /** Save the transaction to YNAB */
  const onSaveTransaction: SubmitEventHandler = useCallback(
    async (event) => {
      event.preventDefault();
      dispatchTxState({ type: "setErrorMessage", message: "" });

      const state = txStore.getState();
      const account = accountsData?.find((a) => a.id === state.accountId);
      const category = categoriesData?.find((c) => c.id === state.categoryId);
      const isBudgetToTracking = isBudgetToTrackingTransfer(
        state.payee,
        account,
        accountsData
      );

      if (!account) {
        dispatchTxState({
          type: "setErrorMessage",
          message: "Please select an account!",
        });
        return;
      }
      if (!state.payee) {
        dispatchTxState({ type: "setErrorMessage", message: "Please enter a payee!" });
        return;
      }
      if (!state.amount) {
        dispatchTxState({
          type: "setErrorMessage",
          message: "Please enter a valid amount!",
        });
        return;
      }
      if (state.isTransfer) {
        if (!("transferId" in state.payee)) {
          dispatchTxState({
            type: "setErrorMessage",
            message: "'To' account is not valid!",
          });
          return;
        }
        if (state.payee.transferId === state.accountId) {
          dispatchTxState({
            type: "setErrorMessage",
            message: "Can't transfer to the same account!",
          });
          return;
        }
        if (state.isSplit && !isBudgetToTrackingTransfer) {
          dispatchTxState({
            type: "setErrorMessage",
            message: "This transfer can't be a split transaction!",
          });
          return;
        }
      }
      if (state.isSplit) {
        if (
          state.subTxs?.some(
            (tx) =>
              tx.payee && "id" in tx.payee && tx.payee.id === account.transfer_payee_id
          )
        ) {
          dispatchTxState({
            type: "setErrorMessage",
            message: "Can't transfer to the same account!",
          });
          return;
        }
        if (leftOverSubTxsAmount !== 0) {
          dispatchTxState({
            type: "setErrorMessage",
            message: "Total of splits doesn't match amount!",
          });
          return;
        }
      }
      if (
        budgetSettings?.transactions.rememberAccount &&
        account.id !== budgetSettings.transactions.defaultAccountId
      )
        setBudgetSettings(
          (prev) =>
            prev && {
              ...prev,
              transactions: {
                ...prev.transactions,
                defaultAccountId: account.id,
              },
            }
        );

      setIsSaving(true);
      try {
        await addTransaction({
          date: state.date,
          amount: stringValueToMillis(state.amount, state.amountType ?? "Outflow"),
          payee_id: "id" in state.payee ? state.payee.id : undefined,
          payee_name: "id" in state.payee ? undefined : state.payee.name,
          account_id: account.id,
          category_id:
            (!state.isTransfer || isBudgetToTracking) && !state.isSplit
              ? category?.id
              : undefined,
          cleared: state.cleared ? "cleared" : "uncleared",
          approved: budgetSettings?.transactions.approved,
          memo: state.memo,
          flag_color: state.flag ? (state.flag as TransactionFlagColor) : undefined,
          subtransactions: state.isSplit
            ? state.subTxs?.map((subTx) => ({
                amount: stringValueToMillis(subTx.amount, subTx.amountType),
                category_id: subTx.categoryId,
                payee_id: subTx.payee && "id" in subTx.payee ? subTx.payee.id : undefined,
                payee_name:
                  subTx.payee && "id" in subTx.payee ? undefined : subTx.payee?.name,
                memo: subTx.memo,
              }))
            : undefined,
        });

        setOmniboxInput("");
        setPopupState(state.returnTo || { view: "main" });
        // biome-ignore lint/suspicious/noExplicitAny: not important
      } catch (err: any) {
        console.error("Error while saving transaction: ", err);
        dispatchTxState({
          type: "setErrorMessage",
          message: "Error adding transaction! " + (err?.error?.detail || ""),
        });
      }
      setIsSaving(false);
    },
    [
      budgetSettings,
      dispatchTxState,
      addTransaction,
      setOmniboxInput,
      setPopupState,
      setBudgetSettings,
      accountsData,
      categoriesData,
      leftOverSubTxsAmount,
    ]
  );

  return {
    dispatch: dispatchTxState,
    onCancelTransaction,
    onSaveTransaction,
    isSaving,
  };
}

const useParseAmountFromUserSelection = (
  enabled: boolean,
  dispatch: (action: TxStoreAction) => void
) => {
  useEffect(() => {
    if (!enabled) return;
    executeScriptInCurrentTab(() => getSelection()?.toString())
      .then((selection) => {
        if (!selection) return;
        const parsedNumber = parseLocaleNumber(selection);
        if (!isNaN(parsedNumber))
          dispatch({ type: "setAmount", amount: parsedNumber.toString() });
      })
      .catch((err) => {
        console.error("Error getting user's selection: ", err);
      });
  }, [enabled, dispatch]);
};
