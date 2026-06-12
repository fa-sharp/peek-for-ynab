import { ArrowLeft, ArrowRight } from "tabler-icons-react";

import { CurrencyView } from "~components";
import type { Category, CurrencyFormat, MoneyMovement } from "~lib/api/client";
import type { DetailViewState } from "~lib/types";

const dateFormatter = new Intl.DateTimeFormat("default", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

export default function MoneyMoveView({
  moneyMove,
  categoryId,
  categories,
  currencyFormat,
  goToDetailView,
}: {
  moneyMove: MoneyMovement;
  categoryId: string;
  categories: Category[];
  currencyFormat?: CurrencyFormat;
  goToDetailView: (detailState: DetailViewState) => void;
}) {
  const direction = moneyMove.from_category_id === categoryId ? "to" : "from";
  const fromCategory = categories.find((c) => c.id === moneyMove.from_category_id);
  const toCategory = categories.find((c) => c.id === moneyMove.to_category_id);
  const date = moneyMove.moved_at || moneyMove.month;

  return (
    <div className="tx-display">
      <div className="flex-row justify-between gap-lg">
        <div className="flex-row min-w-0">
          {date && <span>{dateFormatter.format(new Date(date))}</span>}
          {direction === "to" ? (
            <ArrowLeft aria-label="To" size={14} />
          ) : (
            <ArrowRight aria-label="From" size={14} />
          )}
          <CategoryButton
            category={direction === "to" ? toCategory : fromCategory}
            goToDetailView={goToDetailView}
            fallback="Ready to Assign"
          />
        </div>
        <CurrencyView
          milliUnits={direction === "to" ? -moneyMove.amount : moneyMove.amount}
          currencyFormat={currencyFormat}
          colorsEnabled
        />
      </div>
      {moneyMove.note && (
        <div className="flex-row justify-between font-small">
          <div className="hide-overflow" title={moneyMove.note}>
            {moneyMove.note}
          </div>
        </div>
      )}
    </div>
  );
}

const CategoryButton = ({
  category,
  goToDetailView,
  fallback,
}: {
  category?: Category;
  goToDetailView: (detailState: DetailViewState) => void;
  fallback: string;
}) =>
  category ? (
    <button
      className="button small accent rounded"
      onClick={() => goToDetailView({ type: "category", id: category.id })}>
      {category.name}
    </button>
  ) : (
    <span className="hide-overflow">{fallback}</span>
  );
