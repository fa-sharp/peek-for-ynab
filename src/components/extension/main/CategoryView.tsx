import { clsx } from "clsx";
import type { ReactElement } from "react";
import { AlertTriangle } from "tabler-icons-react";
import type { Category, CurrencyFormat, TransactionDetail } from "ynab";

import { CurrencyView, IconSpan } from "~components";
import type { CategoryAlerts } from "~lib/notifications";
import type { AppSettings } from "~lib/types";

export default function CategoryView({
  categoryData: { id, name, balance },
  currencyFormat,
  settings,
  alerts,
  actionElementsRight,
  actionElementsLeft,
  addedTransaction
}: {
  categoryData: Category;
  currencyFormat?: CurrencyFormat;
  actionElementsRight?: ReactElement | null;
  actionElementsLeft?: ReactElement | null;
  alerts?: CategoryAlerts[string];
  settings: AppSettings;
  addedTransaction?: TransactionDetail | null;
}) {
  return (
    <div
      className={clsx("balance-display", {
        highlighted: settings.animations && addedTransaction?.category_id === id
      })}>
      <div className="flex-row min-w-0">
        {actionElementsLeft}
        <div className="hide-overflow">{name}</div>
        {alerts?.overspent && (
          <IconSpan
            label="Overspent"
            icon={<AlertTriangle color="var(--stale)" size={18} aria-hidden />}
          />
        )}
      </div>
      <div className="flex-row">
        <CurrencyView
          milliUnits={balance}
          currencyFormat={currencyFormat}
          colorsEnabled={true}
          animationEnabled={settings.animations && !!addedTransaction}
        />
        {actionElementsRight}
      </div>
    </div>
  );
}
