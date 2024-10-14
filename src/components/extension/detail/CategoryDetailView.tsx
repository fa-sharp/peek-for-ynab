import React, { useMemo } from "react";
import { ArrowBack } from "tabler-icons-react";

import { CurrencyView, IconButton, TransactionView } from "~components";
import { AddTransactionIcon, AddTransferIcon } from "~components/icons/ActionIcons";
import { useStorageContext, useYNABContext } from "~lib/context";

const CategoryTxsView = () => {
  const { useGetCategoryTxs, categoriesData, selectedBudgetData } = useYNABContext();
  const { settings, popupState, setPopupState, setTxState } = useStorageContext();

  const category = useMemo(
    () => categoriesData?.find((c) => c.id === popupState?.detailState?.id),
    [categoriesData, popupState?.detailState?.id]
  );
  const { data: categoryTxs } = useGetCategoryTxs(popupState?.detailState?.id, 30);

  if (!category || !selectedBudgetData) return <div>Loading...</div>;

  return (
    <section>
      <div className="flex-row justify-between mb-sm">
        <h2 className="heading-medium">{category.name}</h2>
        <IconButton
          icon={<ArrowBack aria-hidden />}
          label="Back to main view"
          onClick={() => setPopupState({ view: "main" })}
        />
      </div>
      <ul className="list mb-lg" aria-label="Category details">
        <li className="balance-display heading-small">
          Available Balance:
          <CurrencyView
            milliUnits={category.balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </li>
        <li className="balance-display">
          Cash Leftover Last Month:
          <CurrencyView
            milliUnits={category.balance - category.activity - category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </li>
        <li className="balance-display">
          Assigned This Month:
          <CurrencyView
            milliUnits={category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </li>
        <li className="balance-display">
          Activity This Month:
          <CurrencyView
            milliUnits={category.activity}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </li>
      </ul>
      <div className="flex-row gap-lg mb-lg">
        <button
          className="button rounded accent flex-row gap-sm"
          onClick={() =>
            setTxState({
              categoryId: category.id,
              returnTo: {
                view: "detail",
                detailState: {
                  type: "category",
                  id: category.id
                }
              }
            }).then(() => setPopupState({ view: "txAdd" }))
          }>
          <AddTransactionIcon /> Transaction
        </button>
        <button
          className="button rounded accent flex-row gap-sm"
          onClick={() =>
            setPopupState({
              view: "move",
              moveMoneyState: {
                toCategoryId: category.id,
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
          <AddTransferIcon /> Move Money
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
                goToDetailView={(detailState) =>
                  setPopupState({ view: "detail", detailState })
                }
                detailLeft="account"
                currencyFormat={selectedBudgetData.currencyFormat}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default CategoryTxsView;
