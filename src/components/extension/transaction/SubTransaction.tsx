import { useId, useRef, useState } from "react";
import type { MouseEventHandler } from "react";
import { Minus, Plus } from "tabler-icons-react";
import type { Category } from "ynab";

import { useYNABContext } from "~lib/context";
import type { CachedPayee } from "~lib/context/ynabContext";

import { CategorySelect, IconButton, PayeeSelect } from "../..";

interface Props {
  amount: string;
  amountType: "Inflow" | "Outflow";
  setAmount: (amount: string) => void;
  setAmountType: (amountType: "Inflow" | "Outflow") => void;
  setPayee: (payee: CachedPayee | { name: string } | null) => void;
  setCategory: (category: Category | null) => void;
  setMemo: (memo: string) => void;
}

/** Form that lets user add a transaction. */
export default function SubTransaction({
  amount,
  amountType,
  setAmount,
  setAmountType,
  setPayee,
  setCategory,
  setMemo
}: Props) {
  const { categoriesData, payeesData } = useYNABContext();

  const amountFieldId = useId();

  const [showPayee, setShowPayee] = useState(false);
  const [showMemo, setShowMemo] = useState(false);

  const payeeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType(amountType === "Inflow" ? "Outflow" : "Inflow");
  };

  return (
    <section
      className="flex-col gap-sm"
      style={{
        paddingBottom: "var(--spacing-lg)",
        borderBottom: "solid 3px var(--border)"
      }}>
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
      {showPayee && (
        <PayeeSelect
          ref={payeeRef}
          payees={payeesData}
          selectPayee={setPayee}
          required={false}
        />
      )}
      <CategorySelect
        ref={categoryRef}
        categories={categoriesData}
        selectCategory={setCategory}
        placeholder=""
      />
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
      <div className="flex-row">
        {!showPayee && (
          <button
            className="button gray rounded flex-row gap-xs"
            onClick={() => {
              setShowPayee(true);
              setTimeout(() => payeeRef.current?.focus(), 50);
            }}>
            <Plus size={12} /> Payee
          </button>
        )}
        {!showMemo && (
          <button
            className="button gray rounded flex-row gap-xs"
            onClick={() => {
              setShowMemo(true);
              setTimeout(() => memoRef.current?.focus(), 50);
            }}>
            <Plus size={12} /> Memo
          </button>
        )}
      </div>
    </section>
  );
}
