import React from "react";
import { CircleC, Lock } from "tabler-icons-react";
import { SaveTransactionClearedEnum } from "ynab";

type Props = {
  status: SaveTransactionClearedEnum;
};

const TxStatusIcon = ({ status }: Props) =>
  status === SaveTransactionClearedEnum.Cleared ? (
    <CircleC
      fill="var(--currency-green)"
      stroke="var(--background)"
      aria-label="Cleared"
    />
  ) : status === SaveTransactionClearedEnum.Reconciled ? (
    <Lock stroke="var(--currency-green)" color="white" aria-label="Reconciled" />
  ) : (
    <CircleC aria-label="Uncleared" stroke="gray" />
  );

export default TxStatusIcon;
