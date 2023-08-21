import React from "react";
import { CircleC, Lock } from "tabler-icons-react";
import { HybridTransaction } from "ynab";

type Props = {
  status: HybridTransaction.ClearedEnum;
};

const TxStatusIcon = ({ status }: Props) =>
  status === HybridTransaction.ClearedEnum.Cleared ? (
    <CircleC fill="var(--currency-green)" color="white" aria-label="Cleared" />
  ) : status === HybridTransaction.ClearedEnum.Reconciled ? (
    <Lock stroke="var(--currency-green)" color="white" aria-label="Reconciled" />
  ) : (
    <CircleC aria-label="Uncleared" stroke="gray" />
  );

export default TxStatusIcon;
