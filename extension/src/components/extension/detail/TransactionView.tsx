import { clsx } from "clsx";
import { useCallback, useState } from "react";
import { ArrowsSplit2, Flag3 } from "tabler-icons-react";

import { CurrencyView, IconButton, IconSpan, TxStatusIcon } from "~components";
import { AddTransferIcon } from "~components/icons/ActionIcons";
import {
  ApprovingIcon,
  UnapprovedAlertIcon,
  UnapprovedMatchAlertIcon,
} from "~components/icons/AlertIcons";
import type {
  CurrencyFormat,
  HybridTransaction,
  SubTransaction,
  TransactionDetail,
} from "~lib/api/client";
import type { DetailViewState } from "~lib/types";

const dateFormatter = new Intl.DateTimeFormat("default", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

export default function TransactionView({
  tx,
  goToDetailView,
  approve,
  detailRight = "memo",
  detailLeft = "category",
  currencyFormat,
  highlighted,
}: {
  tx: TransactionDetail | HybridTransaction;
  goToDetailView: (detailState: DetailViewState) => void;
  approve: (tx: TransactionDetail | HybridTransaction) => Promise<void>;
  detailRight?: "memo";
  detailLeft?: "category" | "account";
  currencyFormat?: CurrencyFormat;
  highlighted?: boolean;
}) {
  const date = new Date(tx.date);
  const isSplit = "subtransactions" in tx && tx.subtransactions.length > 0;

  const [isApproving, setIsApproving] = useState(false);
  const approveTransaction = useCallback(async () => {
    setIsApproving(true);
    try {
      await approve(tx);
    } finally {
      setIsApproving(false);
    }
  }, [tx, approve]);

  return (
    <div className={clsx("tx-display", { highlighted })}>
      <div className="flex-row justify-between gap-lg">
        <div className="flex-row min-w-0">
          {!tx.approved && (
            <IconButton
              label="Unapproved. Click to approve"
              onClick={approveTransaction}
              icon={
                isApproving ? (
                  <ApprovingIcon />
                ) : tx.matched_transaction_id ? (
                  <UnapprovedMatchAlertIcon />
                ) : (
                  <UnapprovedAlertIcon />
                )
              }
              spin={isApproving}
              disabled={isApproving}
            />
          )}
          {tx.flag_color && (
            <IconSpan
              label={tx.flag_name ? `Flag: ${tx.flag_name}` : `${tx.flag_color} flag`}
              icon={
                <Flag3
                  aria-hidden
                  fill={tx.flag_color}
                  stroke={tx.flag_color}
                  size={18}
                />
              }
            />
          )}
          <div>{dateFormatter.format(date)}</div>
          <div className="hide-overflow" title={tx.payee_name ?? ""}>
            {"parent_transaction_id" in tx && !!tx.parent_transaction_id && "(Split) "}
            {tx.payee_name}
          </div>
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
        <div className="flex-row flex-grow">
          {tx.transfer_account_id && (
            <button
              title="Go to transfer account"
              className="button small gray rounded flex-row gap-sm"
              onClick={() =>
                goToDetailView({
                  id: tx.transfer_account_id!,
                  type: "account",
                })
              }>
              <AddTransferIcon size={14} />
              Transfer
            </button>
          )}
          {detailLeft === "category" &&
            (!isSplit ? (
              tx.category_id &&
              tx.category_name && (
                <button
                  className="button small accent rounded"
                  onClick={() =>
                    goToDetailView({ id: tx.category_id!, type: "category" })
                  }>
                  {tx.category_name}
                </button>
              )
            ) : (
              <div className="flex-row">
                <ArrowsSplit2 aria-hidden size={14} />
                Multiple Categories
              </div>
            ))}
          {detailLeft === "account" && (
            <button
              className="button small accent rounded"
              onClick={() =>
                goToDetailView({
                  id: tx.account_id,
                  type: "account",
                })
              }>
              {tx.account_name}
            </button>
          )}
        </div>
        {detailRight === "memo" && (
          <div className="hide-overflow" title={tx.memo || undefined}>
            {tx.memo}
          </div>
        )}
      </div>
      {isSplit && (
        <ul
          aria-label="Split categories"
          className="list flex-col gap-sm font-small px-lg">
          {tx.subtransactions.map((subTx) => (
            <SubTransactionView
              key={subTx.id}
              subTx={subTx}
              goToDetailView={goToDetailView}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const SubTransactionView = ({
  subTx,
  goToDetailView,
  currencyFormat,
}: {
  subTx: SubTransaction;
  goToDetailView: (detailState: DetailViewState) => void;
  currencyFormat?: CurrencyFormat;
}) => (
  <li className="pt-sm border-t-light">
    <div className="flex-row justify-between">
      <div className="flex-row gap-sm">
        {subTx.transfer_account_id && (
          <button
            title="Go to transfer account"
            className="button small accent rounded flex-row gap-sm"
            onClick={() =>
              goToDetailView({
                id: subTx.transfer_account_id!,
                type: "account",
              })
            }>
            <AddTransferIcon size={14} />
            Transfer
          </button>
        )}
        {subTx.category_id && (
          <button
            className="button small rounded accent"
            onClick={() =>
              goToDetailView({
                id: subTx.category_id!,
                type: "category",
              })
            }>
            {subTx.category_name}
          </button>
        )}
      </div>
      <CurrencyView
        milliUnits={subTx.amount}
        currencyFormat={currencyFormat}
        colorsEnabled
      />
    </div>
    <div className="flex-row justify-between">
      <div>{subTx.payee_name}</div>
      <div className="hide-overflow">{subTx.memo}</div>
    </div>
  </li>
);
