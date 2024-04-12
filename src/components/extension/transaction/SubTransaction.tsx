import { useRef, useState } from "react";
import { Plus } from "tabler-icons-react";
import type { Category } from "ynab";

import { useYNABContext } from "~lib/context";
import type { CachedPayee } from "~lib/context/ynabContext";

import { AccountSelect, AmountField, CategorySelect, PayeeSelect } from "../..";

interface Props {
  splitIndex: number;
  amount: string;
  amountType: "Inflow" | "Outflow";
  allowTransfer?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  setAmount: (amount: string) => void;
  setAmountType: (amountType: "Inflow" | "Outflow") => void;
  setPayee: (payee: CachedPayee | { name: string } | null) => void;
  setCategory: (category: Category | null) => void;
  setMemo: (memo: string) => void;
}

export default function SubTransaction({
  splitIndex,
  amount,
  amountType,
  allowTransfer = true,
  autoFocus = false,
  disabled = false,
  setAmount,
  setAmountType,
  setPayee,
  setCategory,
  setMemo
}: Props) {
  const { accountsData, categoriesData, payeesData } = useYNABContext();

  const [showPayee, setShowPayee] = useState(false);
  const [showCategory, setShowCategory] = useState(true);
  const [showMemo, setShowMemo] = useState(false);
  const [isTransfer, setIsTransfer] = useState(false);

  const payeeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  return (
    <fieldset className="flex-col gap-sm rounded" disabled={disabled}>
      <legend>Split {splitIndex + 1}</legend>
      <AmountField
        amount={amount}
        amountType={amountType}
        autoFocus={autoFocus}
        setAmount={setAmount}
        setAmountType={setAmountType}
      />
      {showPayee &&
        (!isTransfer ? (
          <PayeeSelect
            ref={payeeRef}
            payees={payeesData}
            selectPayee={setPayee}
            required={false}
          />
        ) : (
          <AccountSelect
            ref={payeeRef}
            label={amountType === "Outflow" ? "Payee (To)" : "Payee (From)"}
            accounts={accountsData}
            selectAccount={(account) => {
              if (!account || !account.transfer_payee_id) {
                setPayee(null);
                setShowCategory(true);
              } else {
                setPayee({
                  id: account.transfer_payee_id,
                  name: account.name,
                  transferId: account.id
                });
                if (account.on_budget) {
                  setShowCategory(false);
                  setCategory(null);
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
          categories={categoriesData}
          selectCategory={setCategory}
          placeholder=""
        />
      )}
      {showMemo && (
        <label className="form-input">
          Memo
          <input
            ref={memoRef}
            autoComplete="off"
            onChange={(e) => setMemo(e.target.value)}
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
              setIsTransfer(true);
              setTimeout(() => payeeRef.current?.focus(), 50);
            }}>
            <Plus aria-label="Add" size={12} /> Transfer
          </button>
        )}
      </div>
    </fieldset>
  );
}
