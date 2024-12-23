import { clsx } from "clsx";
import type { ReactElement } from "react";
import type { Category, CurrencyFormat, TransactionDetail } from "ynab";

import { CurrencyView, IconSpan } from "~components";
import { OverspendingAlertIcon } from "~components/icons/AlertIcons";
import type { CategoryAlerts } from "~lib/notifications";
import type { AppSettings } from "~lib/types";

export default function CategoryView({
  categoryData: { id, name, balance },
  currencyFormat,
  settings,
  alerts,
  actionElementsRight,
  actionElementsLeft,
  addedTransaction,
  moved
}: {
  categoryData: Category;
  currencyFormat?: CurrencyFormat;
  actionElementsRight?: ReactElement | null;
  actionElementsLeft?: ReactElement | null;
  alerts?: CategoryAlerts[string];
  settings: AppSettings;
  addedTransaction?: TransactionDetail | null;
  moved?: { from?: Category; to?: Category } | null;
}) {
  return (
    <div
      className={clsx("balance-display", {
        highlighted:
          settings.animations &&
          (addedTransaction?.category_id === id ||
            addedTransaction?.subtransactions.some((sub) => sub.category_id === id) ||
            moved?.from?.id === id ||
            moved?.to?.id === id)
      })}>
      <div className="flex-row min-w-0">
        {actionElementsLeft}
        <div className="hide-overflow">{name}</div>
        {alerts?.overspent && (
          <IconSpan label="Overspent" icon={<OverspendingAlertIcon />} />
        )}
      </div>
      <div className="flex-row">
        <CurrencyView
          milliUnits={balance}
          currencyFormat={currencyFormat}
          colorsEnabled={true}
          animationEnabled={settings.animations && (!!addedTransaction || !!moved)}
        />
        {actionElementsRight}
      </div>
    </div>
  );
}
