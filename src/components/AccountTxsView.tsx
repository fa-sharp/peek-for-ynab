import React from "react";
import * as ynab from "ynab";

import { useYNABContext } from "~lib/context";

import CurrencyView from "./CurrencyView";

type Props = {
  id: string;
};

const AccountTxsView = ({ id }: Props) => {
  const { useGetAccountTxs, selectedBudgetData } = useYNABContext();

  const { data: accountTxs } = useGetAccountTxs(id);

  return (
    <div>
      <h1>Account transactions</h1>
      {accountTxs?.map((tx) => {
        const date = ynab.utils.convertFromISODateString(tx.date);
        return (
          <div key={tx.id} className="balance-display">
            <div>{`${date.getUTCMonth() + 1}/${date.getUTCDate()}, ${
              tx.payee_name
            }`}</div>
            <CurrencyView
              milliUnits={tx.amount}
              currencyFormat={selectedBudgetData?.currencyFormat}
              colorsEnabled
            />
          </div>
        );
      })}
    </div>
  );
};

export default AccountTxsView;
