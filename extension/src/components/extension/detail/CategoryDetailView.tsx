import { useMemo, useState } from "react";
import { ArrowBack } from "tabler-icons-react";

import { CurrencyView, IconButton, MoneyMoveView, TransactionView } from "~components";
import { AddTransactionIcon, AddTransferIcon } from "~components/icons/ActionIcons";
import { useStorageContext, useYNABContext } from "~lib/context";
import { useAppSettings } from "~lib/state";

const CategoryTxsView = () => {
  const { popupState, setPopupState } = useStorageContext();
  const {
    useGetCategoryTxs,
    categoriesData,
    selectedBudgetData,
    approveTransaction,
    addedTransaction,
    movedTransaction,
    useGetMoneyMoves,
  } = useYNABContext();
  const { settings } = useAppSettings();
  const [showAllMoneyMoves, setShowAllMoneyMoves] = useState(false);

  const category = useMemo(
    () => categoriesData?.find((c) => c.id === popupState.detailState?.id),
    [categoriesData, popupState.detailState?.id]
  );
  const { data: categoryTxs } = useGetCategoryTxs(popupState.detailState?.id, 30);
  const { data: moneyMoves } = useGetMoneyMoves();

  const categoryMoneyMoves = useMemo(() => {
    return moneyMoves?.filter(
      (move) =>
        move.from_category_id === category?.id || move.to_category_id === category?.id
    );
  }, [category?.id, moneyMoves]);

  const visibleMoneyMoves = useMemo(() => {
    if (!categoryMoneyMoves) return null;
    return showAllMoneyMoves ? categoryMoneyMoves : categoryMoneyMoves.slice(0, 4);
  }, [categoryMoneyMoves, showAllMoneyMoves]);

  const animateBalances = useMemo(() => {
    return (
      !!addedTransaction ||
      movedTransaction?.from?.id === category?.id ||
      movedTransaction?.to?.id === category?.id
    );
  }, [addedTransaction, movedTransaction, category?.id]);

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
            animationEnabled={settings?.animations && animateBalances}
          />
        </li>
        <li className="balance-display">
          Cash Leftover Last Month:
          <CurrencyView
            milliUnits={category.balance - category.activity - category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations && animateBalances}
          />
        </li>
        <li className="balance-display">
          Assigned This Month:
          <CurrencyView
            milliUnits={category.budgeted}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations && animateBalances}
          />
        </li>
        <li className="balance-display">
          Activity This Month:
          <CurrencyView
            milliUnits={category.activity}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations && animateBalances}
          />
        </li>
      </ul>
      <div className="flex-row gap-lg mb-lg">
        <button
          className="button rounded accent flex-row gap-sm"
          onClick={() =>
            setPopupState({
              view: "txAdd",
              txState: {
                categoryId: category.id,
                returnTo: {
                  view: "detail",
                  detailState: {
                    type: "category",
                    id: category.id,
                  },
                },
              },
            })
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
                    id: category.id,
                  },
                },
              },
            })
          }>
          <AddTransferIcon /> Move Money
        </button>
      </div>
      <h3 className="heading-medium mb-sm">Money Moves</h3>
      {!categoryMoneyMoves ? (
        <div>Loading money moves...</div>
      ) : categoryMoneyMoves.length === 0 ? (
        <div>No money moves this month</div>
      ) : visibleMoneyMoves ? (
        <>
          <ul className="list flex-col gap-sm">
            {visibleMoneyMoves.map((moneyMove) => (
              <li key={moneyMove.id}>
                <MoneyMoveView
                  moneyMove={moneyMove}
                  categoryId={category.id}
                  categories={categoriesData || []}
                  goToDetailView={(detailState) =>
                    setPopupState({ view: "detail", detailState })
                  }
                  currencyFormat={selectedBudgetData.currencyFormat}
                />
              </li>
            ))}
          </ul>
          {!showAllMoneyMoves && categoryMoneyMoves.length > 4 && (
            <div className="flex-row font-small mb-md">
              <button
                className="button gray rounded"
                onClick={() => setShowAllMoneyMoves(true)}>
                Show more
              </button>
            </div>
          )}
        </>
      ) : (
        <div>Loading money moves...</div>
      )}
      <h3 className="heading-medium mt-md mb-sm">Activity</h3>
      {!categoryTxs ? (
        <div>Loading transactions...</div>
      ) : categoryTxs.length === 0 ? (
        <div>No recent transactions</div>
      ) : (
        <ul className="list flex-col gap-sm">
          {categoryTxs.map((tx) => (
            <li key={tx.id}>
              <TransactionView
                tx={tx}
                approve={approveTransaction}
                goToDetailView={(detailState) =>
                  setPopupState({ view: "detail", detailState })
                }
                detailLeft="account"
                currencyFormat={selectedBudgetData.currencyFormat}
                highlighted={tx.id === addedTransaction?.id}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default CategoryTxsView;
