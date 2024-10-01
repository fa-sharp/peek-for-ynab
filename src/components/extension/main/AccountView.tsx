import { clsx } from "clsx";
import type { ReactElement } from "react";
import { AlertTriangle, Circle, LockOpen } from "tabler-icons-react";
import type { Account, CurrencyFormat, TransactionDetail } from "ynab";

import { CurrencyView, IconSpan } from "~components";
import type { AccountAlerts } from "~lib/notifications";
import type { AppSettings } from "~lib/types";
import { formatDateMonthAndDay } from "~lib/utils";

export default function AccountView({
  account: { id, name, balance, last_reconciled_at },
  currencyFormat,
  actionElementsLeft,
  actionElementsRight,
  alerts,
  settings,
  addedTransaction
}: {
  account: Account;
  currencyFormat?: CurrencyFormat;
  actionElementsLeft?: ReactElement | null;
  actionElementsRight?: ReactElement | null;
  alerts?: AccountAlerts[string];
  settings: AppSettings;
  addedTransaction?: TransactionDetail | null;
}) {
  return (
    <div
      className={clsx("balance-display", {
        highlighted:
          settings.animations &&
          (addedTransaction?.account_id === id ||
            addedTransaction?.transfer_account_id === id)
      })}>
      <div className="flex-row gap-sm min-w-0">
        {actionElementsLeft}
        <div className="hide-overflow">{name}</div>
        {!!alerts?.numUnapprovedTxs && (
          <IconSpan
            label={`${alerts.numUnapprovedTxs} unapproved transaction${alerts.numUnapprovedTxs > 1 ? "s" : ""}`}
            icon={<Circle aria-hidden fill="#2ea1be" stroke="transparent" size={16} />}
          />
        )}
        {alerts?.importError && (
          <IconSpan
            label="Import issue"
            icon={<AlertTriangle aria-hidden color="var(--stale)" size={18} />}
          />
        )}
        {alerts?.reconcile && last_reconciled_at && (
          <IconSpan
            label={`Last reconciled on ${formatDateMonthAndDay(new Date(last_reconciled_at))}`}
            icon={<LockOpen aria-hidden color="var(--stale)" size={18} />}
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
