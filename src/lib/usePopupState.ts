import { useState } from "react";

export interface AddTransactionInitialState {
  accountId?: string;
  categoryId?: string;
}

export interface TransactionsViewState {
  id: string;
  type: "account" | "category";
}

/** Hook to manage the state of the overall popup view */
export const usePopupState = () => {
  const [popupState, setPopupState] = useState<{
    page: "main" | "addTx" | "txView";
    addTxInitialState?: AddTransactionInitialState;
    txsViewState?: TransactionsViewState;
  }>({ page: "main" });

  const openAddTransaction = (initialState?: AddTransactionInitialState) => {
    setPopupState({ page: "addTx", addTxInitialState: initialState });
  };

  const openPopupView = () => setPopupState({ page: "main" });

  const openTxsView = (state: TransactionsViewState) =>
    setPopupState({
      page: "txView",
      txsViewState: state
    });

  return {
    popupState,
    openAddTransaction,
    openPopupView,
    openTxsView
  };
};
