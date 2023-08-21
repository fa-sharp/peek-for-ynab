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

const CategoryTxsView = ({ id, onBack }: Props) => {
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
            currencyFormat={selectedBudgetData.currencyFormat}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryTxsView;
