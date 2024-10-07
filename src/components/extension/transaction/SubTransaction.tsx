import { useRef, useState } from "react";
import { Plus } from "tabler-icons-react";

import type { BudgetMainData, SubTxState } from "~lib/types";

import { AccountSelect, AmountField, CategorySelect, PayeeSelect } from "../..";

interface Props {
  splitIndex: number;
  txState: SubTxState;
  allowTransfer?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  setField: <T extends keyof SubTxState>(field: T, value: SubTxState[T]) => void;
  budgetMainData: BudgetMainData;
}

export default function SubTransaction({
  splitIndex,
  txState,
  setField,
  allowTransfer = true,
  autoFocus = false,
  disabled = false,
  budgetMainData
}: Props) {
  const [showPayee, setShowPayee] = useState(!!txState.payee);
  const [showMemo, setShowMemo] = useState(!!txState.memo);
  const [showCategory, setShowCategory] = useState(() => {
    if (txState.isTransfer && txState.payee && "id" in txState.payee) {
      const transferAccount = budgetMainData.accountsData.find(
        (a) => a.transfer_payee_id === (txState.payee as { id: string }).id
      );
      if (transferAccount && transferAccount.on_budget) return false;
    }
    return true;
  });

  const payeeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  return (
    <fieldset className="flex-col gap-sm rounded" disabled={disabled}>
      <legend>Split {splitIndex + 1}</legend>
      <AmountField
        amount={txState.amount}
        amountType={txState.amountType}
        autoFocus={autoFocus}
        setAmount={(amount) => setField("amount", amount)}
        setAmountType={(amountType) => setField("amountType", amountType)}
      />
      {showPayee &&
        (!txState.isTransfer ? (
          <PayeeSelect
            ref={payeeRef}
            initialPayee={txState.payee}
            payees={budgetMainData.payeesData}
            selectPayee={(payee) => setField("payee", payee)}
            required={false}
          />
        ) : (
          <AccountSelect
            ref={payeeRef}
            currentAccount={
              txState.payee && "id" in txState.payee
                ? budgetMainData.accountsData.find(
                    (a) => a.transfer_payee_id === (txState.payee as { id: string }).id
                  )
                : null
            }
            label={txState.amountType === "Outflow" ? "Payee (To)" : "Payee (From)"}
            accounts={budgetMainData.accountsData}
            selectAccount={(account) => {
              if (!account || !account.transfer_payee_id) {
                setField("payee", null);
                setShowCategory(true);
              } else {
                setField("payee", {
                  id: account.transfer_payee_id,
                  name: account.name,
                  transferId: account.id
                });
                if (account.on_budget) {
                  setShowCategory(false);
                  setField("categoryId", undefined);
                } else {
                  setShowCategory(true);
                }
              }
            }}
          />
        ))}
      {showCategory && (
        <CategorySelect
          ref={categoryRef}
          initialCategory={
            !txState.categoryId
              ? null
              : budgetMainData.categoriesData.find((c) => c.id === txState.categoryId)
          }
          categories={budgetMainData.categoriesData}
          categoryGroupsData={budgetMainData.categoryGroupsData}
          selectCategory={(category) => setField("categoryId", category?.id)}
          placeholder=""
        />
      )}
      {showMemo && (
        <label className="form-input">
          Memo
          <input
            ref={memoRef}
            autoComplete="off"
            value={txState.memo}
            onChange={(e) => setField("memo", e.target.value)}
          />
        </label>
      )}
      <div className="flex-row" style={{ fontSize: ".9em" }}>
        {!showPayee && (
          <button
            type="button"
            className="button gray rounded flex-row gap-xs"
            onClick={() => {
              setShowPayee(true);
              setTimeout(() => payeeRef.current?.focus(), 50);
            }}>
            <Plus aria-label="Add" size={12} /> Payee
          </button>
        )}
        {!showMemo && (
          <button
            type="button"
            className="button gray rounded flex-row gap-xs"
            onClick={() => {
              setShowMemo(true);
              setTimeout(() => memoRef.current?.focus(), 50);
            }}>
            <Plus aria-label="Add" size={12} /> Memo
          </button>
        )}
        {!showPayee && allowTransfer && (
          <button
            type="button"
            className="button gray rounded flex-row gap-xs"
            onClick={() => {
              setShowPayee(true);
              setField("isTransfer", true);
              setTimeout(() => payeeRef.current?.focus(), 50);
            }}>
            <Plus aria-label="Add" size={12} /> Transfer
          </button>
        )}
      </div>
    </fieldset>
  );
}
