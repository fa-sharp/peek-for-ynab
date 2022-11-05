import { useState } from "react";

export interface AddTransactionInitialState {
  accountId?: string;
  categoryId?: string;
}

/** Hook to manage the state of the Add Transaction view */
export const useAddTransaction = () => {
  const [addTxState, setAddTxState] = useState<{
    show: boolean;
    initialState?: AddTransactionInitialState;
  }>({ show: false });

  const openAddTransaction = (initialState?: AddTransactionInitialState) => {
    setAddTxState({ show: true, initialState });
  };

  const closeAddTransaction = () => setAddTxState({ show: false });

  return {
    addTxState,
    openAddTransaction,
    closeAddTransaction
  };
};
