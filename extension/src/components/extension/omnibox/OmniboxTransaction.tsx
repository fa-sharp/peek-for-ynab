import { Fragment, useEffect, useMemo, useRef } from "react";
import { Help, Pencil, Wand } from "tabler-icons-react";

import { CurrencyView, Dialog, Tooltip } from "~components";
import {
  getPossibleTransferFields,
  getPossibleTxFields,
  type ParsedTransferQuery,
  type ParsedTxQuery,
} from "~lib/omnibox";
import { useTxStore } from "~lib/state";
import type { BudgetMainData, CachedBudget } from "~lib/types";
import type { TransactionFormDispatch } from "~lib/useTransaction";
import {
  getIgnoredCategoryIdsForTx,
  getTodaysDateISO,
  stringValueToMillis,
} from "~lib/utils";
import OmniboxTransactionFields from "./OmniboxTransactionFields";
import OmniboxTransferFields from "./OmniboxTransferFields";

const TX_FIELDS = Object.freeze([
  { idx: 0, prefix: "", label: "amount" },
  { idx: 2, prefix: "at", label: "payee" },
  { idx: 3, prefix: "for", label: "category" },
  { idx: 4, prefix: "on", label: "account" },
  { idx: 5, prefix: "memo", label: "memo" },
]);
const TRANSFER_FIELDS = Object.freeze([
  { idx: 0, prefix: "", label: "amount" },
  { idx: 2, prefix: "to/from", label: "account" },
  { idx: 3, prefix: "to/from", label: "account" },
  { idx: 4, prefix: "for", label: "category" },
  { idx: 5, prefix: "memo", label: "memo" },
]);

interface Props {
  parsedQuery: ParsedTxQuery | ParsedTransferQuery;
  budget: CachedBudget;
  budgetMainData: BudgetMainData;
  dispatch: TransactionFormDispatch;
  isSaving: boolean;
  openTxForm: () => void;
  defaultAccountId?: string;
}

export default function OmniboxTransaction({
  parsedQuery,
  budget,
  budgetMainData,
  dispatch,
  isSaving,
  openTxForm,
  defaultAccountId,
}: Props) {
  const { amount, amountType, accountId, payee, memo, errorMessage } = useTxStore(
    (s) => ({
      amount: s.amount,
      amountType: s.amountType,
      accountId: s.accountId,
      payee: s.payee,
      memo: s.memo,
      errorMessage: s.errorMessage,
    }),
  );

  const defaultAccount = useMemo(() => {
    if (!defaultAccountId) return;
    return budgetMainData.accountsData.find((a) => a.id === defaultAccountId);
  }, [budgetMainData, defaultAccountId]);

  const ignoredCategoryIds = useMemo(() => {
    if (!budgetMainData) return undefined;
    return getIgnoredCategoryIdsForTx(budgetMainData.categoryGroupsData);
  }, [budgetMainData]);

  const results = useMemo(() => {
    if (!parsedQuery || !budgetMainData) return null;
    return parsedQuery.type === "tx"
      ? getPossibleTxFields(parsedQuery, budgetMainData, ignoredCategoryIds)
      : getPossibleTransferFields(parsedQuery, budgetMainData, ignoredCategoryIds);
  }, [budgetMainData, ignoredCategoryIds, parsedQuery]);

  const initialAmount = useRef(amount);
  const canSubmitImmediately = !!amount && !!payee && !!accountId;

  useEffect(() => dispatch({ type: "setDate", date: getTodaysDateISO() }), [dispatch]);
  useEffect(() => {
    if (!parsedQuery || !results) return;
    dispatch({ type: "setAmount", amount: parsedQuery.amount || initialAmount.current });
    dispatch({ type: "setMemo", memo: parsedQuery.memo });
    if (parsedQuery.type === "tx" && "payeeResults" in results) {
      dispatch({ type: "setIsTransfer", isTransfer: false });
      dispatch({ type: "setAmountType", amountType: parsedQuery.amountType });
      dispatch({ type: "setPayee", payee: results.payeeResults[0] || null });
      dispatch({
        type: "setCategory",
        categoryId: results.categoryResults[0].id || null,
      });
      dispatch({
        type: "setAccount",
        accountId:
          !parsedQuery.accountQuery && defaultAccount
            ? defaultAccount.id
            : results.accountResults[0]?.id || null,
      });
    } else if (results && "fromAccountResults" in results) {
      dispatch({ type: "setIsTransfer", isTransfer: true });
      dispatch({ type: "setAmountType", amountType: "Outflow" });
      if (results.toAccountResults[0] && results.toAccountResults[0].transfer_payee_id)
        dispatch({
          type: "setPayee",
          payee: {
            id: results.toAccountResults[0].transfer_payee_id,
            name: results.toAccountResults[0].name,
            transferId: results.toAccountResults[0].id,
          },
        });
      else dispatch({ type: "setPayee", payee: null });
      dispatch({
        type: "setAccount",
        accountId: results.fromAccountResults[0]?.id || null,
      });
      dispatch({
        type: "setCategory",
        categoryId: results.categoryResults[0]?.id || null,
      });
    }
  }, [defaultAccount, dispatch, parsedQuery, results]);

  return (
    <>
      <div style={{ fontSize: ".95em", padding: "2px" }}>
        <Tooltip label="More info" icon={<Help aria-hidden size={16} />}>
          <Dialog>
            Type all the info first, then change the selections below if needed. You can
            skip fields, but you must use the keywords in the order listed (e.g.
            &quot;24.85 on amex&quot;, not &quot;on amex 24.85&quot;. If you have entered
            an amount, payee, and account, you can submit the transaction immediately with
            the <kbd>Enter</kbd> key.
          </Dialog>
        </Tooltip>
        {parsedQuery.type === "tx" ? " add " : " transfer "}
        {(parsedQuery.type === "tx" ? TX_FIELDS : TRANSFER_FIELDS).map((field) => (
          <Fragment key={field.idx}>
            {parsedQuery.lastParsedIdx === field.idx ? (
              <b>{`${field.prefix ? field.prefix + " " : ""}{${field.label}} `}</b>
            ) : (
              `${field.prefix ? field.prefix + " " : ""}{${field.label}} `
            )}
          </Fragment>
        ))}
      </div>
      <h2 className="heading-big flex-row">
        {parsedQuery.type === "tx" ? "Add Transaction" : "Add Transfer/Payment"}
      </h2>
      <div className="flex-col">
        {amount && (
          <div className="flex-row gap-sm">
            Amount:
            <CurrencyView
              milliUnits={stringValueToMillis(
                amount,
                parsedQuery.type === "tx" ? (amountType ?? "Outflow") : "Inflow",
              )}
              currencyFormat={budget.currencyFormat}
            />
          </div>
        )}
        {parsedQuery?.type === "tx" && results && "payeeResults" in results && (
          <OmniboxTransactionFields
            {...{ dispatch: dispatch, parsedQuery, results, defaultAccount }}
          />
        )}
        {parsedQuery?.type === "transfer" &&
          results &&
          "fromAccountResults" in results && (
            <OmniboxTransferFields {...{ dispatch, parsedQuery, results }} />
          )}
        {memo && <div className="flex-row gap-sm">Memo: {memo}</div>}
        <div className="text-error">{errorMessage}</div>
        <div className="flex-row mt-lg">
          <button
            type={canSubmitImmediately ? "submit" : "button"}
            className="flex-1 flex-row justify-center button accent rounded"
            disabled={isSaving || !canSubmitImmediately}>
            <Wand aria-hidden size={18} /> Save now
          </button>
          <button
            type={canSubmitImmediately ? "button" : "submit"}
            className="flex-1 flex-row justify-center button accent rounded"
            onClick={(e) => {
              e.preventDefault();
              openTxForm();
            }}
            disabled={isSaving}>
            <Pencil aria-hidden size={19} /> Edit and save
          </button>
        </div>
      </div>
    </>
  );
}
