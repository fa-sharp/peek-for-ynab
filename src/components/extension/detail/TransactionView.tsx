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
  detailLeft = "memo",
  detailRight = "category",
  detailRightOnClick,
  currencyFormat
}: {
  tx: ynab.TransactionDetail | ynab.HybridTransaction;
  detailLeft?: "memo";
  detailRight?: "category" | "account";
  detailRightOnClick?: () => void;
  currencyFormat?: ynab.CurrencyFormat;
}) {
  const date = ynab.utils.convertFromISODateString(tx.date);

  return (
    <div
      style={{
        borderBottom: "solid 1px var(--border-light)"
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 6
        }}>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "6px"
        }}>
        <button
          className="button accent cursor-pointer font-small"
          style={{
            border: "none",
            flexShrink: 0,
            padding: "2px 5px"
          }}
          onClick={detailRightOnClick}>
          {tx.transfer_account_id
            ? "Transfer"
            : detailRight === "category"
              ? tx.category_name
              : tx.account_name}
        </button>
        {tx.memo && detailLeft === "memo" ? (
          <div className="font-small hide-overflow">{tx.memo}</div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}
