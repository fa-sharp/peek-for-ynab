import { CircleC, Lock } from "tabler-icons-react";

import type { TransactionClearedStatus } from "~lib/api/client";

type Props = {
  status: TransactionClearedStatus;
};

const TxStatusIcon = ({ status }: Props) =>
  status === "cleared" ? (
    <CircleC
      size={20}
      fill="var(--currency-green)"
      stroke="var(--background)"
      aria-label="Cleared"
    />
  ) : status === "reconciled" ? (
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
