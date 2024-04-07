import { type MouseEventHandler, useId } from "react";
import { Minus, Plus } from "tabler-icons-react";

import IconButton from "~components/IconButton";

type Props = {
  amount: string;
  amountType: "Inflow" | "Outflow";
  setAmount: (amount: string) => void;
  setAmountType: (amountType: "Inflow" | "Outflow") => void;
};

const AmountField = ({ amount, amountType, setAmount, setAmountType }: Props) => {
  const amountFieldId = useId();
  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType(amountType === "Inflow" ? "Outflow" : "Inflow");
  };

  return (
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
  );
};
export default AmountField;
