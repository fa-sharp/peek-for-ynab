import { useRef, useState } from "react";
import type { MouseEventHandler } from "react";
import { Minus, Plus } from "tabler-icons-react";
import type { Category } from "ynab";

import { useStorageContext, useYNABContext } from "~lib/context";
import type { CachedPayee } from "~lib/context/ynabContext";

import { CategorySelect, IconButton, PayeeSelect } from "../..";

interface Props {
  amount: string;
  setAmount: (amount: string) => void;
  setPayee: (payee: CachedPayee | { name: string } | null) => void;
  setCategory: (category: Category | null) => void;
}

/** Form that lets user add a transaction. */
export default function SubTransaction({
  amount,
  setAmount,
  setPayee,
  setCategory
}: Props) {
  const { categoriesData, payeesData } = useYNABContext();
  const { popupState } = useStorageContext();

  const [amountType, setAmountType] = useState<"Inflow" | "Outflow">(
    popupState.txAddState?.amountType || "Outflow"
  );

  const categoryRef = useRef<HTMLInputElement>(null);

  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType((prev) => (prev === "Inflow" ? "Outflow" : "Inflow"));
  };

  return (
    <section style={{ minWidth: 240 }}>
      <div className="heading-big">
        <div role="heading">Add Transaction</div>
      </div>
      <label className="form-input" htmlFor="amount-input">
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
            id="amount-input"
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
      <PayeeSelect payees={payeesData} selectPayee={setPayee} />
      <CategorySelect
        ref={categoryRef}
        categories={categoriesData}
        selectCategory={setCategory}
      />
    </section>
  );
}
