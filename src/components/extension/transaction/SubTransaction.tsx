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
}

/** Form that lets user add a transaction. */
export default function SubTransaction({
  amount,
  amountType,
  setAmount,
  setAmountType,
  setPayee,
  setCategory
}: Props) {
  const { categoriesData, payeesData } = useYNABContext();

  const amountFieldId = useId();

  const [showPayee, setShowPayee] = useState(false);

  const categoryRef = useRef<HTMLInputElement>(null);

  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType(amountType === "Inflow" ? "Outflow" : "Inflow");
  };

  return (
    <section
      className="flex-col gap-xs"
      style={{
        paddingBottom: "var(--spacing-lg)",
        borderBottom: "solid 1px var(--border)",
        fontSize: ".9em"
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
        <PayeeSelect payees={payeesData} selectPayee={setPayee} required={false} />
      )}
      <CategorySelect
        ref={categoryRef}
        categories={categoriesData}
        selectCategory={setCategory}
        placeholder=""
      />
    </section>
  );
}
