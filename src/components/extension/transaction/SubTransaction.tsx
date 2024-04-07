import { useId, useRef, useState } from "react";
import type { MouseEventHandler } from "react";
import { Minus, Plus } from "tabler-icons-react";
import type { Category } from "ynab";

import { useYNABContext } from "~lib/context";
import type { CachedPayee } from "~lib/context/ynabContext";

import { AccountSelect, CategorySelect, IconButton, PayeeSelect } from "../..";

interface Props {
  splitIndex: number;
  amount: string;
  amountType: "Inflow" | "Outflow";
  allowTransfer?: boolean;
  setAmount: (amount: string) => void;
  setAmountType: (amountType: "Inflow" | "Outflow") => void;
  setPayee: (payee: CachedPayee | { name: string } | null) => void;
  setCategory: (category: Category | null) => void;
  setMemo: (memo: string) => void;
}

/** Form that lets user add a transaction. */
export default function SubTransaction({
  splitIndex,
  amount,
  amountType,
  allowTransfer = true,
  setAmount,
  setAmountType,
  setPayee,
  setCategory,
  setMemo
}: Props) {
  const { accountsData, categoriesData, payeesData } = useYNABContext();

  const amountFieldId = useId();

  const [showPayee, setShowPayee] = useState(false);
  const [showCategory, setShowCategory] = useState(true);
  const [showMemo, setShowMemo] = useState(false);
  const [isTransfer, setIsTransfer] = useState(false);

  const payeeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType(amountType === "Inflow" ? "Outflow" : "Inflow");
  };

  return (
    <section
      aria-label={`Split ${splitIndex + 1}`}
      className="flex-col gap-sm pb-lg border-b">
      <label className="form-input" htmlFor={amountFieldId}>
        Amount
        <div className="flex-row">
          <IconButton
            label={`${amountType === "Inflow" ? "Inflow" : "Outflow"} (Click to switch)`}
            icon={
              amountType === "Inflow" ? (
                <Plus color="var(--currency-green)" />
              ) : (
                <Minus color="var(--currency-red)" />
              )
            }
            onClick={flipAmountType}
          />
          <input
            id={amountFieldId}
            required
            autoFocus
            aria-label="Amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.001"
            placeholder="0.00"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </label>
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
    </section>
  );
}
