import { clsx } from "clsx";
import type { ReactElement } from "react";
import type { Account, CurrencyFormat, TransactionDetail } from "ynab";

import { CurrencyView, IconSpan } from "~components";
import {
  ImportErrorIcon,
  ReconcileAlertIcon,
  UnapprovedAlertIcon
} from "~components/icons/AlertIcons";
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
            addedTransaction?.transfer_account_id === id ||
            addedTransaction?.subtransactions.some(
              (sub) => sub.transfer_account_id === id
            ))
      })}>
      <div className="flex-row gap-sm min-w-0">
        {actionElementsLeft}
        <div className="hide-overflow">{name}</div>
        {!!alerts?.numUnapprovedTxs && (
          <IconSpan
            label={`${alerts.numUnapprovedTxs} unapproved transaction${alerts.numUnapprovedTxs > 1 ? "s" : ""}`}
            icon={<UnapprovedAlertIcon />}
          />
        )}
        {alerts?.importError && (
          <IconSpan label="Import issue" icon={<ImportErrorIcon />} />
        )}
        {alerts?.reconcile && last_reconciled_at && (
          <IconSpan
            label={`Last reconciled on ${formatDateMonthAndDay(new Date(last_reconciled_at))}`}
            icon={<ReconcileAlertIcon />}
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
