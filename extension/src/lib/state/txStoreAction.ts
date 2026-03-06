import type { SetStateAction } from "react";

import type { CachedPayee, SubTxState } from "~lib/types";

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
