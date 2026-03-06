import type { SubTxState, TxAddState } from "~lib/types";
import { getTodaysDateISO } from "~lib/utils";

export const DEFAULT_SUB_TX: SubTxState = {
  amount: "",
  amountType: "Outflow",
  isTransfer: false,
};

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
