import React, { useMemo } from "react";
import { ArrowBack } from "tabler-icons-react";

import { useYNABContext } from "~lib/context";

import CurrencyView from "./CurrencyView";
import IconButton from "./IconButton";
import TransactionView from "./TransactionView";

type Props = {
  id: string;
  onBack?: () => void;
};

const AccountTxsView = ({ id, onBack }: Props) => {
  const { useGetAccountTxs, accountsData, selectedBudgetData } = useYNABContext();

  const account = useMemo(
    () => accountsData?.find((a) => a.id === id),
    [accountsData, id]
  );
  const { data: accountTxs } = useGetAccountTxs(id);

  // Todo: Loading/error states
  if (!account || !accountTxs || !selectedBudgetData) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="heading-big mb-small">{account.name}</h2>
        <IconButton icon={<ArrowBack />} label="Back to main view" onClick={onBack} />
      </div>
      <div className="flex-row">
        <div className="balance-display">
          Working:
          <CurrencyView
            milliUnits={account.balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
        <div className="balance-display">
          Cleared:
          <CurrencyView
            milliUnits={account.cleared_balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
        <div className="balance-display">
          Uncleared:
          <CurrencyView
            milliUnits={account.uncleared_balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
      </div>
      <h3 className="heading-medium mt-md">Transactions</h3>
      <div className="flex-col gap-sm">
        {accountTxs.map((tx) => (
          <TransactionView
            key={tx.id}
            tx={tx}
            detailRight="category"
            currencyFormat={selectedBudgetData.currencyFormat}
          />
        ))}
      </div>
    </div>
  );
};

export default AccountTxsView;
