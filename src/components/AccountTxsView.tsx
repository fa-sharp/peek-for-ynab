import React, { useMemo } from "react";

import { useYNABContext } from "~lib/context";

import CurrencyView from "./CurrencyView";
import TransactionView from "./TransactionView";

type Props = {
  id: string;
};

const AccountTxsView = ({ id }: Props) => {
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
      <h2 className="heading-big mb-small">{account.name}</h2>
      <div className="balance-display">
        Working Balance:
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
      <h3 className="heading-medium mt-big">Transactions</h3>
      {accountTxs.map((tx) => (
        <TransactionView
          key={tx.id}
          tx={tx}
          detailRight="category"
          currencyFormat={selectedBudgetData.currencyFormat}
        />
      ))}
    </div>
  );
};

export default AccountTxsView;
