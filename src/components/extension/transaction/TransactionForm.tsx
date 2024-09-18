import { useRef } from "react";
import { Check, CircleC } from "tabler-icons-react";
import { TransactionFlagColor } from "ynab";

import { AmountField, IconButton, MemoField } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import useTransaction from "~lib/useTransaction";
import { flagColorToEmoji, getTodaysDateISO } from "~lib/utils";

import TransactionFormMain from "./TransactionFormMain";
import TransactionFormMainTransfer from "./TransactionFormMainTransfer";
import TransactionFormSplit from "./TransactionFormSplit";

/** Form that lets user add a transaction. */
export default function TransactionForm() {
  const { selectedBudgetData, accountsData, categoriesData, payeesData } =
    useYNABContext();
  const { settings, setPopupState } = useStorageContext();

  const { formState, derivedState, handlers, onSaveTransaction, isSaving } =
    useTransaction();
  const memoRef = useRef<HTMLInputElement>(null);

  return (
    <section style={{ minWidth: "280px" }}>
      <div className="heading-big">
        <div role="heading">Add Transaction</div>
      </div>
      <form className="flex-col" onSubmit={onSaveTransaction}>
        <div className="flex-col gap-0">
          <label className="flex-row">
            Split transaction?
            {formState.isSplit ? (
              <IconButton
                label="Split (click to switch)"
                icon={<Check color="var(--currency-green)" />}
                onClick={() => handlers.setIsSplit(false)}
              />
            ) : (
              <IconButton
                label="Not a split (click to switch)"
                icon={<Check color="#aaa" />}
                onClick={() => handlers.setIsSplit(true)}
              />
            )}
          </label>
          <label className="flex-row">
            Transfer/Payment?
            {formState.isTransfer ? (
              <IconButton
                label="Transfer (click to switch)"
                icon={<Check color="var(--currency-green)" />}
                onClick={() => handlers.setIsTransfer(false)}
              />
            ) : (
              <IconButton
                label="Not a transfer (click to switch)"
                icon={<Check color="#aaa" />}
                onClick={() => handlers.setIsTransfer(true)}
              />
            )}
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
              accountsData,
              categoriesData,
              payeesData,
              memoRef,
              isSaving
            }}
          />
        ) : (
          <TransactionFormMainTransfer
            {...{
              formState,
              handlers,
              accountsData,
              categoriesData,
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
          />
        )}
        <div className="flex-row justify-between mt-sm">
          <label className="flex-row">
            Status:
            {formState.cleared ? (
              <IconButton
                label="Cleared (click to switch)"
                icon={<CircleC fill="var(--currency-green)" color="white" />}
                onClick={() => handlers.setCleared(false)}
              />
            ) : (
              <IconButton
                label="Uncleared (click to switch)"
                icon={<CircleC color="gray" />}
                onClick={() => handlers.setCleared(true)}
              />
            )}
          </label>
          <label className="flex-row">
            Flag:
            <select
              className="select rounded"
              value={formState.flag}
              onChange={(e) => handlers.setFlag(e.target.value)}>
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
