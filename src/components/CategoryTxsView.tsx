import React, { useMemo } from "react";
import { ArrowBack } from "tabler-icons-react";

import { useYNABContext } from "~lib/context";
import type { TransactionsViewState } from "~lib/usePopupState";

import CurrencyView from "./CurrencyView";
import IconButton from "./IconButton";
import TransactionView from "./TransactionView";

type Props = {
  id: string;
  onOpenTxsView?: (state: TransactionsViewState) => void;
  onBack?: () => void;
};

const CategoryTxsView = ({ id, onBack, onOpenTxsView }: Props) => {
  const { useGetCategoryTxs, categoriesData, selectedBudgetData } = useYNABContext();

  const category = useMemo(
    () => categoriesData?.find((c) => c.id === id),
    [categoriesData, id]
  );
  const { data: categoryTxs } = useGetCategoryTxs(id);

  // Todo: Loading/error states
  if (!category || !categoryTxs || !selectedBudgetData) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="heading-big mb-small">{category.name}</h2>
        <IconButton icon={<ArrowBack />} label="Back to main view" onClick={onBack} />
      </div>
      <div className="flex-row">
        <div className="balance-display">
          Balance:
          <CurrencyView
            milliUnits={category.balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
          />
        </div>
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
      <h3 className="heading-medium mt-md">Transactions</h3>
      <div className="flex-col gap-sm">
        {categoryTxs?.map((tx) => (
          <TransactionView
            key={tx.id}
            tx={tx}
            detailRight="account"
            detailRightOnClick={() =>
              onOpenTxsView &&
              onOpenTxsView({
                id: tx.account_id,
                type: "account"
              })
            }
            currencyFormat={selectedBudgetData.currencyFormat}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryTxsView;
