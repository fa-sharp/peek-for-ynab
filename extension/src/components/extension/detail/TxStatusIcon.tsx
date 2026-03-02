import React from "react";
import { CircleC, Lock } from "tabler-icons-react";
import { TransactionClearedStatus } from "ynab";

type Props = {
  status: TransactionClearedStatus;
};

const TxStatusIcon = ({ status }: Props) =>
  status === TransactionClearedStatus.Cleared ? (
    <CircleC
      size={20}
      fill="var(--currency-green)"
      stroke="var(--background)"
      aria-label="Cleared"
    />
  ) : status === TransactionClearedStatus.Reconciled ? (
    <Lock
      size={20}
      stroke="var(--currency-green)"
      color="white"
      aria-label="Reconciled"
    />
  ) : (
    <CircleC size={20} aria-label="Uncleared" stroke="gray" />
  );

export default TxStatusIcon;
