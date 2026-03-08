import type { SetStateAction } from "react";
import { createStore, type ExtractState, type StateCreator, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import { STORAGE_KEYS } from "~lib/constants";
import type { CachedPayee, SubTxState, TxAddState } from "~lib/types";
import { stringValueToMillis } from "~lib/utils";
import { DEFAULT_SUB_TX, DEFAULT_TX_STATE } from "./txStoreDefaults";
import { createZustandChromeStorage, useZustandChromeStorageEvents } from "./utils";

/** The type of the transaction form Zustand store */
export type TxStore = ExtractState<typeof txStore>;

interface TxStoreActions {
  dispatch: (action: TxStoreAction) => void;
  replace: (txState: TxAddState) => void;
  reset: () => void;
}

const txStoreInit: StateCreator<TxAddState & TxStoreActions> = (set, get, store) => ({
  ...DEFAULT_TX_STATE,
  dispatch: (action) => set((state) => txStateReducer(state, action)),
  replace: (txState) => set({ ...txStoreInit(set, get, store), ...txState }, true),
  reset: () => set(txStoreInit(set, get, store), true),
});

/** The transaction form Zustand store */
export const txStore = createStore<TxAddState & TxStoreActions>()(
  persist(txStoreInit, {
    name: STORAGE_KEYS.TxState,
    storage: createZustandChromeStorage("local"),
    version: 1,
  })
);

/** Subscribe and use the transaction form Zustand store in a React component */
export const useTxStore = <U>(selector: (state: TxAddState & TxStoreActions) => U) => {
  const store = useStore(txStore, useShallow(selector));
  useZustandChromeStorageEvents(txStore, "local");

  return store;
};

/** Some useful computed subtotals for split transactions */
export const useTxStoreSubTxTotals = () => {
  const { subTxs, amount, amountType } = useTxStore((s) => ({
    subTxs: s.subTxs,
    amount: s.amount,
    amountType: s.amountType,
  }));
  const totalSubTxsAmount = (subTxs ?? []).reduce(
    (sum, tx) => sum + stringValueToMillis(tx.amount, tx.amountType),
    0
  );
  const leftOverSubTxsAmount =
    stringValueToMillis(amount ?? "0", amountType || "Outflow") - totalSubTxsAmount;

  return { totalSubTxsAmount, leftOverSubTxsAmount };
};

/** Handle the transaction form state updates */
const txStateReducer = (prev: TxAddState, action: TxStoreAction): Partial<TxAddState> => {
  switch (action.type) {
    case "setAmount":
      return { amount: action.amount };
    case "setAmountType":
      return { amountType: action.amountType };
    case "setDate":
      return { date: action.date };
    case "setAccount":
      return { accountId: action.accountId };
    case "setCategory":
      return { categoryId: action.categoryId };
    case "setPayee":
      return { payee: action.payee };
    case "setMemo":
      return {
        memo:
          typeof action.memo === "function" ? action.memo(prev.memo ?? "") : action.memo,
      };
    case "setFlag":
      return { flag: action.flag };
    case "setIsTransfer":
      return { isTransfer: action.isTransfer };
    case "setIsSplit":
      return {
        subTxs: action.isSplit ? [DEFAULT_SUB_TX] : undefined,
        isSplit: action.isSplit,
      };
    case "addSubTx":
      return {
        subTxs: [...(prev.subTxs || []), DEFAULT_SUB_TX],
      };
    case "removeSubTx":
      return {
        subTxs: prev.subTxs?.slice(0, -1),
      };
    case "editSubTx":
      return {
        subTxs: prev.subTxs?.with(action.idx, action.update(prev.subTxs[action.idx])),
      };
    case "setCleared":
      return { cleared: action.cleared };
    case "setErrorMessage":
      return { errorMessage: action.message };
  }
};

/** All actions that can be dispatched to update the transaction form store. */
export type TxStoreAction =
  | {
      type: "setAmount";
      amount?: string;
    }
  | {
      type: "setAmountType";
      amountType: "Inflow" | "Outflow";
    }
  | {
      type: "setDate";
      date: string;
    }
  | {
      type: "setAccount";
      accountId: string | null;
    }
  | {
      type: "setCategory";
      categoryId: string | null;
    }
  | {
      type: "setPayee";
      payee: CachedPayee | { name: string } | null;
    }
  | {
      type: "setMemo";
      memo: SetStateAction<string>;
    }
  | {
      type: "setFlag";
      flag: string;
    }
  | {
      type: "setIsTransfer";
      isTransfer: boolean;
    }
  | {
      type: "setIsSplit";
      isSplit: boolean;
    }
  | {
      type: "addSubTx";
    }
  | {
      type: "removeSubTx";
    }
  | {
      type: "editSubTx";
      idx: number;
      update: (tx: SubTxState) => SubTxState;
    }
  | {
      type: "setCleared";
      cleared: boolean;
    }
  | { type: "setErrorMessage"; message?: string };
