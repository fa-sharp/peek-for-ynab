import React, { useMemo } from "react";
import { ArrowBack } from "tabler-icons-react";

import { CurrencyView, IconButton, TransactionView } from "~components";
import { AddTransactionIcon } from "~components/icons/ActionIcons";
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
          />
        </div>
        <div className="balance-display">
          Leftover Last Month:
          <CurrencyView
            milliUnits={category.balance - category.activity - category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
        <div className="balance-display">
          Assigned This Month:
          <CurrencyView
            milliUnits={category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
        <div className="balance-display">
          Activity This Month:
          <CurrencyView
            milliUnits={category.activity}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
      </div>
      <div className="flex-row justify-between gap-lg mb-sm">
        <h3 className="heading-medium">Activity</h3>
        <div className="flex-row">
          Actions:{" "}
          <IconButton
            rounded
            accent
            label="Add transaction"
            icon={<AddTransactionIcon />}
            onClick={() =>
              setPopupState({
                view: "txAdd",
                txAddState: {
                  categoryId: category.id
                }
              })
            }
          />
        </div>
      </div>
      {!categoryTxs ? (
        <div>Loading transactions...</div>
      ) : (
        <div className="flex-col gap-sm">
          {categoryTxs.map((tx) => (
            <TransactionView
              key={tx.id}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTxsView;
