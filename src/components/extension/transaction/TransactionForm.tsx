import { useRef } from "react";
import { CircleC } from "tabler-icons-react";
import { TransactionFlagColor } from "ynab";

import { AmountField, IconButton, MemoField } from "~components";
import { CheckIcon } from "~components/icons/ActionIcons";
import { useStorageContext, useYNABContext } from "~lib/context";
import useTransaction from "~lib/useTransaction";
import { flagColorToEmoji, getTodaysDateISO } from "~lib/utils";

import TransactionFormMain from "./TransactionFormMain";
import TransactionFormMainTransfer from "./TransactionFormMainTransfer";
import TransactionFormSplit from "./TransactionFormSplit";

/** Form that lets user add a transaction. */
export default function TransactionForm() {
  const { selectedBudgetData, budgetMainData } = useYNABContext();
  const { settings, setPopupState } = useStorageContext();

  const { formState, derivedState, handlers, onSaveTransaction, isSaving } =
    useTransaction();
  const memoRef = useRef<HTMLInputElement>(null);

  if (!budgetMainData) return <div>Loading...</div>;

  return (
    <section style={{ minWidth: "270px" }}>
      <div className="heading-big">
        <div role="heading">Add Transaction</div>
      </div>
      <form className="flex-col" onSubmit={onSaveTransaction}>
        <div className="flex-col gap-0">
          <label className="flex-row">
            Split transaction?
            <IconButton
              role="switch"
              aria-checked={formState.isSplit ? "true" : "false"}
              icon={
                <CheckIcon color={formState.isSplit ? "var(--currency-green)" : "#aaa"} />
              }
              onClick={() => handlers.setIsSplit((prev) => !prev)}
            />
          </label>
          <label className="flex-row">
            Transfer/Payment?
            <IconButton
              role="switch"
              aria-checked={formState.isTransfer ? "true" : "false"}
              icon={
                <CheckIcon
                  color={formState.isTransfer ? "var(--currency-green)" : "#aaa"}
                />
              }
              onClick={() => handlers.setIsTransfer((prev) => !prev)}
            />
          </label>
        </div>
        <AmountField
          amount={formState.amount}
          amountType={formState.amountType}
          disabled={isSaving}
          setAmount={handlers.setAmount}
          setAmountType={handlers.setAmountType}
        />
        {!formState.isTransfer ? (
          <TransactionFormMain
            {...{
              formState,
              handlers,
              budgetMainData,
              memoRef,
              isSaving
            }}
          />
        ) : (
          <TransactionFormMainTransfer
            {...{
              formState,
              handlers,
              budgetMainData,
              memoRef,
              isBudgetToTrackingTransfer: derivedState.isBudgetToTrackingTransfer,
              totalSubTxsAmount: derivedState.totalSubTxsAmount,
              isSaving
            }}
          />
        )}
        <MemoField
          ref={memoRef}
          memo={formState.memo}
          setMemo={handlers.setMemo}
          disabled={isSaving}
          settings={settings}
        />
        {formState.isSplit && (
          <TransactionFormSplit
            formState={formState}
            handlers={handlers}
            leftOverSubTxsAmount={derivedState.leftOverSubTxsAmount}
            totalSubTxsAmount={derivedState.totalSubTxsAmount}
            currencyFormat={selectedBudgetData?.currencyFormat}
            isSaving={isSaving}
            budgetMainData={budgetMainData}
          />
        )}
        <div className="flex-row justify-between mt-sm">
          <label className="flex-row">
            Cleared:
            <IconButton
              role="switch"
              aria-checked={formState.cleared ? "true" : "false"}
              icon={
                <CircleC
                  aria-hidden
                  fill={formState.cleared ? "var(--currency-green)" : undefined}
                  color={formState.cleared ? "var(--background)" : "gray"}
                />
              }
              onClick={() => handlers.setCleared((prev) => !prev)}
              disabled={isSaving}
            />
          </label>
          <label className="flex-row">
            Flag:
            <select
              className="select rounded"
              value={formState.flag}
              onChange={(e) => handlers.setFlag(e.target.value)}
              disabled={isSaving}>
              <option value="">None</option>
              {Object.entries(TransactionFlagColor).map(([flagName, flagValue]) => (
                <option key={flagValue} value={flagValue}>
                  {`${flagColorToEmoji(flagValue) || ""} ${flagName}`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="form-input">
          Date
          <input
            required
            type="date"
            value={formState.date}
            max={getTodaysDateISO()}
            onChange={(e) => handlers.setDate(e.target.value)}
            disabled={isSaving}
          />
        </label>
        <div className="error-message">{formState.errorMessage}</div>
        <div className="flex-row flex-row-reverse mt-lg">
          <button
            type="submit"
            className="button rounded accent flex-1"
            disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="button gray rounded flex-1"
            onClick={() => setPopupState({ view: "main" })}
            disabled={isSaving}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
