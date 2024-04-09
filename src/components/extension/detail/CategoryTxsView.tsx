import React, { useMemo } from "react";
import { ArrowBack } from "tabler-icons-react";

import { CurrencyView, IconButton, TransactionView } from "~components";
import { AddTransactionIcon } from "~components/icons/ActionIcons";
import { useStorageContext, useYNABContext } from "~lib/context";

const CategoryTxsView = () => {
  const { useGetCategoryTxs, categoriesData, selectedBudgetData } = useYNABContext();
  const { settings, popupState, setPopupState } = useStorageContext();

  const category = useMemo(
    () => categoriesData?.find((c) => c.id === popupState.detailState?.id),
    [categoriesData, popupState.detailState?.id]
  );
  const { data: categoryTxs } = useGetCategoryTxs(popupState.detailState?.id, 30);

  if (!category || !selectedBudgetData) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex-row justify-between mb-sm">
        <h2 className="heading-big">{category.name}</h2>
        <IconButton
          icon={<ArrowBack />}
          label="Back to main view"
          onClick={() => setPopupState({ view: "main" })}
        />
      </div>
      <div className="flex-col gap-sm mb-lg">
        <div className="balance-display heading-medium">
          Available Balance:
          <CurrencyView
            milliUnits={category.balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </div>
        <div className="balance-display">
          Cash Leftover Last Month:
          <CurrencyView
            milliUnits={category.balance - category.activity - category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </div>
        <div className="balance-display">
          Assigned This Month:
          <CurrencyView
            milliUnits={category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </div>
        <div className="balance-display">
          Activity This Month:
          <CurrencyView
            milliUnits={category.activity}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </div>
      </div>
      <div className="flex-row mb-lg">
        <button
          className="button rounded accent flex-row"
          onClick={() =>
            setPopupState({
              view: "txAdd",
              txAddState: {
                categoryId: category.id,
                returnTo: {
                  view: "detail",
                  detailState: {
                    type: "category",
                    id: category.id
                  }
                }
              }
            })
          }>
          <AddTransactionIcon /> Transaction
        </button>
      </div>
      <h3 className="heading-medium mb-sm">Activity</h3>
      {!categoryTxs ? (
        <div>Loading transactions...</div>
      ) : (
        <ul className="list flex-col gap-sm">
          {categoryTxs.map((tx) => (
            <li key={tx.id}>
              <TransactionView
                tx={tx}
                detailLeft="account"
                detailLeftOnClick={() =>
                  setPopupState({
                    view: "detail",
                    detailState: { id: tx.account_id, type: "account" }
                  })
                }
                currencyFormat={selectedBudgetData.currencyFormat}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryTxsView;
