import { Fragment, useEffect, useMemo, useRef } from "react";
import { Help, Pencil, Wand } from "tabler-icons-react";

import { CurrencyView, Dialog, Tooltip } from "~components";
import {
  type ParsedTransferQuery,
  type ParsedTxQuery,
  getPossibleTransferFields,
  getPossibleTxFields
} from "~lib/omnibox";
import type { BudgetMainData, CachedBudget, TxAddInitialState } from "~lib/types";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";
import { getIgnoredCategoryIdsForTx, stringValueToMillis } from "~lib/utils";

import OmniboxTransactionFields from "./OmniboxTransactionFields";
import OmniboxTransferFields from "./OmniboxTransferFields";

const txFields = [
  { idx: 0, prefix: "", label: "amount" },
  { idx: 2, prefix: "at", label: "payee" },
  { idx: 3, prefix: "for", label: "category" },
  { idx: 4, prefix: "on", label: "account" },
  { idx: 5, prefix: "memo", label: "memo" }
];
const transferFields = [
  { idx: 0, prefix: "", label: "amount" },
  { idx: 2, prefix: "to/from", label: "account" },
  { idx: 3, prefix: "to/from", label: "account" },
  { idx: 4, prefix: "for", label: "category" },
  { idx: 5, prefix: "memo", label: "memo" }
];

interface Props {
  parsedQuery: ParsedTxQuery | ParsedTransferQuery;
  budget: CachedBudget;
  budgetMainData: BudgetMainData;
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
  isSaving: boolean;
  openTxForm: (txState: TxAddInitialState) => void;
  defaultAccountId?: string;
}

export default function OmniboxTransaction({
  parsedQuery,
  budget,
  budgetMainData,
  formState,
  handlers,
  isSaving,
  openTxForm,
  defaultAccountId
}: Props) {
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

  const initialAmount = useRef(formState.amount);
  const canSubmitImmediately =
    !!formState.amount && !!formState.payee && !!formState.account;

  useEffect(() => {
    if (!parsedQuery || !results) return;
    handlers.setAmount(parsedQuery.amount || initialAmount.current);
    handlers.setMemo(parsedQuery.memo);
    if (parsedQuery.type === "tx" && "payeeResults" in results) {
      handlers.setIsTransfer(false);
      handlers.setAmountType(parsedQuery.amountType);
      handlers.setPayee(results.payeeResults[0] || null);
      handlers.setCategory(results.categoryResults[0] || null);
      handlers.setAccount(
        !parsedQuery.accountQuery && defaultAccount
          ? defaultAccount
          : results.accountResults[0] || null
      );
    } else if (results && "fromAccountResults" in results) {
      handlers.setIsTransfer(true);
      handlers.setAmountType("Outflow");
      if (results.toAccountResults[0] && results.toAccountResults[0].transfer_payee_id)
        handlers.setPayee({
          id: results.toAccountResults[0].transfer_payee_id,
          name: results.toAccountResults[0].name,
          transferId: results.toAccountResults[0].id
        });
      else handlers.setPayee(null);
      handlers.setAccount(results.fromAccountResults[0] || null);
      handlers.setCategory(results.categoryResults[0] || null);
    }
  }, [defaultAccount, handlers, parsedQuery, results]);

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
        {(parsedQuery.type === "tx" ? txFields : transferFields).map((field) => (
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
        {formState.amount && (
          <div className="flex-row gap-sm">
            Amount:
            <CurrencyView
              milliUnits={stringValueToMillis(formState.amount, formState.amountType)}
              currencyFormat={budget.currencyFormat}
            />
          </div>
        )}
        {parsedQuery?.type === "tx" && results && "payeeResults" in results && (
          <OmniboxTransactionFields
            {...{ formState, handlers, parsedQuery, results, defaultAccount }}
          />
        )}
        {parsedQuery?.type === "transfer" &&
          results &&
          "fromAccountResults" in results && (
            <OmniboxTransferFields {...{ formState, handlers, parsedQuery, results }} />
          )}
        {formState.memo && <div className="flex-row gap-sm">Memo: {formState.memo}</div>}
        <div className="error-message">{formState.errorMessage}</div>
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
              openTxForm({
                amount: formState.amount,
                amountType: formState.amountType,
                accountId: formState.account?.id,
                categoryId: formState.category?.id,
                payee:
                  formState.payee && "id" in formState.payee
                    ? formState.payee
                    : undefined,
                isTransfer: formState.isTransfer,
                memo: formState.memo
              });
            }}
            disabled={isSaving}>
            <Pencil aria-hidden size={19} /> Edit and save
          </button>
        </div>
      </div>
    </>
  );
}
