import * as ynab from "ynab";

import { CurrencyView, TxStatusIcon } from "~components";
import { flagColorToEmoji } from "~lib/utils";

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
  currencyFormat
}: {
  tx: ynab.TransactionDetail | ynab.HybridTransaction;
  detailRight?: "memo";
  detailLeft?: "category" | "account";
  detailLeftOnClick?: () => void;
  currencyFormat?: ynab.CurrencyFormat;
}) {
  const date = ynab.utils.convertFromISODateString(tx.date);

  return (
    <div className="tx-display">
      <div className="flex-row justify-between gap-lg">
        <div className="flex-row">
          {tx.flag_color && flagColorToEmoji(tx.flag_color)}
          <div>{dateFormatter.format(date)}</div>
          <div className="hide-overflow">{tx.payee_name}</div>
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
      <div className="flex-row gap-lg justify-between font-small">
        <button className="button small accent rounded" onClick={detailLeftOnClick}>
          {detailLeft === "category" &&
          tx.category_name &&
          tx.category_name !== "Uncategorized"
            ? tx.category_name
            : detailLeft === "account"
              ? tx.account_name
              : tx.transfer_account_id
                ? tx.payee_name
                : "No category"}
        </button>
        {tx.memo && detailRight === "memo" ? (
          <div className="hide-overflow">{tx.memo}</div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}
