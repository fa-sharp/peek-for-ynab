import React, { useMemo } from "react";
import { ArrowBack } from "tabler-icons-react";

import { CurrencyView, IconButton, TransactionView } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

const CategoryTxsView = () => {
  const { useGetCategoryTxs, categoriesData, selectedBudgetData } = useYNABContext();
  const { popupState, setPopupState } = useStorageContext();

  const category = useMemo(
    () => categoriesData?.find((c) => c.id === popupState.detailState?.id),
    [categoriesData, popupState.detailState?.id]
  );
  const { data: categoryTxs } = useGetCategoryTxs(popupState.detailState?.id);

  if (!category || !selectedBudgetData) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex-row justify-between">
        <h2 className="heading-big mb-lg">{category.name}</h2>
        <IconButton
          icon={<ArrowBack />}
          label="Back to main view"
          onClick={() => setPopupState({ view: "main" })}
        />
      </div>
      <div className="flex-col gap-sm mb-lg">
        <div className="balance-display">
          Available Balance:
          <CurrencyView
            milliUnits={category.balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
        <div className="flex-row justify-between">
          <div className="balance-display">
            Budgeted:
            <CurrencyView
              milliUnits={category.budgeted}
              currencyFormat={selectedBudgetData.currencyFormat}
              colorsEnabled
            />
          </div>
          <div className="balance-display">
            Activity:
            <CurrencyView
              milliUnits={category.activity}
              currencyFormat={selectedBudgetData.currencyFormat}
              colorsEnabled
            />
          </div>
        </div>
      </div>
      <h3 className="heading-medium">Transactions</h3>
      {!categoryTxs ? (
        <div>Loading transactions...</div>
      ) : (
        <div className="flex-col gap-sm">
          {categoryTxs.map((tx) => (
            <TransactionView
              key={tx.id}
              tx={tx}
              detailRight="account"
              detailRightOnClick={() =>
                setPopupState({
                  view: "detail",
                  detailState: { id: tx.account_id, type: "account" }
                })
              }
              currencyFormat={selectedBudgetData.currencyFormat}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTxsView;
