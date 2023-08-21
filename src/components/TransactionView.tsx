import { useState } from "react";
import { ChevronDown, ChevronRight } from "tabler-icons-react";
import * as ynab from "ynab";

import CurrencyView from "./CurrencyView";
import IconButton from "./IconButton";
import TxStatusIcon from "./TxStatusIcon";

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
          style={{
            position: "relative",
            bottom: "var(--list-gap-sm)",
            display: "flex",
            justifyContent: "space-between",
            gap: "4px"
          }}>
          {tx.memo && detailLeft === "memo" ? (
            <div>
              {tx.memo.slice(0, 35)}
              {tx.memo.length > 35 ? "..." : ""}
            </div>
          ) : (
            <div></div>
          )}
          <div
            className="accent cursor-pointer"
            style={{
              paddingInline: "4px"
            }}
            onClick={detailRightOnClick}>
            {tx.transfer_account_id
              ? "Transfer"
              : detailRight === "category"
              ? tx.category_name
              : tx.account_name}
          </div>
        </div>
      )}
    </>
  );
}
