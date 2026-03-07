import type { SubTxState, TxAddState } from "~lib/types";
import { getTodaysDateISO } from "~lib/utils";

/** Initial default state for a sub/split transaction */
export const DEFAULT_SUB_TX: SubTxState = {
  amount: "",
  amountType: "Outflow",
  isTransfer: false,
};

/** Initial default state for transaction form */
export const DEFAULT_TX_STATE: TxAddState = {
  amount: "",
  amountType: "Outflow",
  isTransfer: false,
  cleared: false,
  isSplit: false,
  subTxs: [DEFAULT_SUB_TX],
  date: getTodaysDateISO(),
  returnTo: { view: "main" },
};
