import React, { useMemo } from "react";
import { ArrowBack } from "tabler-icons-react";

import { CurrencyView, IconButton, TransactionView } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

const AccountTxsView = () => {
  const { popupState, setPopupState } = useStorageContext();
  const { useGetAccountTxs, accountsData, selectedBudgetData } = useYNABContext();

  const account = useMemo(
    () => accountsData?.find((a) => a.id === popupState.detailState?.id),
    [accountsData, popupState.detailState?.id]
  );
  const { data: accountTxs } = useGetAccountTxs(popupState.detailState?.id);

  // TODO: Loading/error states
  if (!account || !accountTxs || !selectedBudgetData) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="heading-big mb-small">{account.name}</h2>
        <IconButton
          icon={<ArrowBack />}
          label="Back to main view"
          onClick={() => setPopupState({ view: "main" })}
        />
      </div>
      <div className="flex-col">
        <div className="balance-display">
          Working Balance:
          <CurrencyView
            milliUnits={account.balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
        <div className="flex-row" style={{ justifyContent: "space-between" }}>
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
      </div>
      <h3 className="heading-medium mt-md">Transactions</h3>
      <div className="flex-col gap-sm">
        {accountTxs.map((tx) => (
          <TransactionView
            key={tx.id}
            tx={tx}
            detailRight="category"
            detailRightOnClick={() =>
              tx.category_id &&
              setPopupState({
                view: "detail",
                detailState: { id: tx.category_id, type: "category" }
              })
            }
            currencyFormat={selectedBudgetData.currencyFormat}
          />
        ))}
      </div>
    </div>
  );
};

export default AccountTxsView;
