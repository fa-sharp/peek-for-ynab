import { Flag3 } from "tabler-icons-react";
import * as ynab from "ynab";

import { CurrencyView, TxStatusIcon } from "~components";
import { AddTransferIcon } from "~components/icons/ActionIcons";

const dateFormatter = new Intl.DateTimeFormat("default", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC"
});

export default function TransactionView({
  tx,
  detailRight = "memo",
  detailLeft = "category",
  detailLeftOnClick,
  transferOnClick,
  currencyFormat
}: {
  tx: ynab.TransactionDetail | ynab.HybridTransaction;
  detailRight?: "memo";
  detailLeft?: "category" | "account";
  detailLeftOnClick?: () => void;
  transferOnClick?: () => void;
  currencyFormat?: ynab.CurrencyFormat;
}) {
  const date = ynab.utils.convertFromISODateString(tx.date);

  return (
    <div className="tx-display">
      <div className="flex-row justify-between gap-lg">
        <div className="flex-row">
          {tx.flag_color && (
            <Flag3
              aria-label={`${tx.flag_color} flag`}
              fill={tx.flag_color}
              stroke={tx.flag_color}
              size={18}
            />
          )}
          <div>{dateFormatter.format(date)}</div>
          <div className="hide-overflow">{tx.payee_name}</div>
        </div>
        <div className="flex-row gap-sm">
          <CurrencyView
            milliUnits={tx.amount}
            currencyFormat={currencyFormat}
            colorsEnabled
          />
          <TxStatusIcon status={tx.cleared} />
        </div>
      </div>
      <div className="flex-row gap-lg justify-between font-small">
        <div className="flex-row">
          {tx.transfer_account_id && transferOnClick && (
            <button
              title="Go to transfer account"
              className="button small accent rounded flex-row gap-sm"
              onClick={transferOnClick}>
              <AddTransferIcon size={15} />
              Transfer
            </button>
          )}
          {detailLeft === "category" &&
            tx.category_name !== "Split" &&
            tx.category_name !== "Uncategorized" && (
              <button className="button small accent rounded" onClick={detailLeftOnClick}>
                {tx.category_name}
              </button>
            )}
          {detailLeft === "account" && (
            <button className="button small accent rounded" onClick={detailLeftOnClick}>
              {tx.account_name}
            </button>
          )}
        </div>
        {tx.memo && detailRight === "memo" ? (
          <div className="hide-overflow">{tx.memo}</div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}
