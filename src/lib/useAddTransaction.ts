import { useState } from "react";

export interface AddTransactionInitialState {
  accountId?: string;
  categoryId?: string;
}

/** Hook to manage the state of the overall popup view */
export const usePopupState = () => {
  const [popupState, setPopupState] = useState<{
    page: "main" | "addTx" | "txView";
    addTxInitialState?: AddTransactionInitialState;
    txsViewState?: { type: "category" | "account"; id: string };
  }>({ page: "main" });

  const openAddTransaction = (initialState?: AddTransactionInitialState) => {
    setPopupState({ page: "addTx", addTxInitialState: initialState });
  };

  const openPopupView = () => setPopupState({ page: "main" });

  const openTxsView = (type: "category" | "account", id: string) =>
    setPopupState({
      page: "txView",
      txsViewState: { id, type }
    });

  return {
    popupState,
    openAddTransaction,
    openPopupView,
    openTxsView
  };
};
