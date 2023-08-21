import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "tabler-icons-react";
import * as ynab from "ynab";

import { useYNABContext } from "~lib/context";

import CurrencyView from "./CurrencyView";
import IconButton from "./IconButton";
import TxStatusIcon from "./TxStatusIcon";

type Props = {
  id: string;
};

const CategoryTxsView = ({ id }: Props) => {
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
      <h2 className="heading-big">{category.name}</h2>
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
      <h3 className="heading-medium mt-big">Transactions</h3>
      {categoryTxs?.map((tx) => (
        <CategoryTransaction
          key={tx.id}
          tx={tx}
          currencyFormat={selectedBudgetData.currencyFormat}
        />
      ))}
    </div>
  );
};

export default CategoryTxsView;

function CategoryTransaction({
  tx,
  currencyFormat
}: {
  tx: ynab.HybridTransaction;
  currencyFormat?: ynab.CurrencyFormat;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = ynab.utils.convertFromISODateString(tx.date);

  return (
    <>
      <div
        className="balance-display cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}>
        <div className="flex-row">
          <IconButton
            icon={
              expanded ? (
                <ChevronDown color="var(--action)" size="0.9rem" />
              ) : (
                <ChevronRight color="var(--action)" size="0.9rem" />
              )
            }
            label={expanded ? "Collapse" : "Expand"}
          />
          <div>{`${date.getUTCMonth() + 1}/${date.getUTCDate()}`}</div>
          {tx.payee_name}
        </div>
        <div className="flex-row">
          <CurrencyView
            milliUnits={tx.amount}
            currencyFormat={currencyFormat}
            colorsEnabled
          />
          <TxStatusIcon status={tx.cleared} />
        </div>
      </div>
      {expanded && (
        <div
          className="font-small"
          style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
          {tx.memo ? (
            <div>
              {tx.memo.slice(0, 40)}
              {tx.memo.length > 40 ? "..." : ""}
            </div>
          ) : (
            <div></div>
          )}
          <div
            style={{
              borderLeft: "solid 1px var(--border-light)",
              paddingLeft: "4px"
            }}>
            {tx.account_name}
          </div>
        </div>
      )}
    </>
  );
}
