import { useSetAtom } from "jotai";
import { type SetStateAction, useCallback, useEffect, useRef } from "react";
import { CircleC } from "tabler-icons-react";
import { TransactionFlagColor } from "ynab";

import { AmountField, IconButton, MemoField } from "~components";
import { CheckIcon as Check } from "~components/icons/ActionIcons";
import { useStorageContext, useYNABContext } from "~lib/context";
import { popupStateAtom, useTxStore } from "~lib/state";
import type {
  AppSettings,
  BudgetMainData,
  BudgetSettings,
  CachedBudget,
} from "~lib/types";
import useTransaction from "~lib/useTransaction";
import { flagColorToEmoji, getTodaysDateISO } from "~lib/utils";
import TransactionFormMain from "./TransactionFormMain";
import TransactionFormMainTransfer from "./TransactionFormMainTransfer";
import TransactionFormSplit from "./TransactionFormSplit";

/** Form that lets the user add a transaction. */
export default function TransactionFormWrapper() {
  const { selectedBudgetData, budgetMainData } = useYNABContext();
  const { settings, budgetSettings } = useStorageContext();

  return (
    <section>
      <div className="heading-big">
        <div role="heading">Add Transaction</div>
      </div>
      {!budgetMainData ? (
        <div>Loading...</div>
      ) : (
        <TransactionFormInner
          budgetMainData={budgetMainData}
          selectedBudgetData={selectedBudgetData}
          settings={settings}
          budgetSettings={budgetSettings}
        />
      )}
    </section>
  );
}

interface Props {
  selectedBudgetData?: CachedBudget | null;
  budgetMainData: BudgetMainData;
  budgetSettings?: BudgetSettings;
  settings?: AppSettings;
}

export function TransactionFormInner({
  budgetMainData,
  budgetSettings,
  selectedBudgetData,
  settings,
}: Props) {
  const { onSaveTransaction, isSaving } = useTransaction();

  const {
    amount,
    amountType,
    accountId,
    date,
    isSplit,
    isTransfer,
    cleared,
    flag,
    memo,
    errorMessage,
    dispatch,
  } = useTxStore((s) => ({
    amount: s.amount,
    amountType: s.amountType,
    accountId: s.accountId,
    date: s.date,
    isSplit: s.isSplit,
    isTransfer: s.isTransfer,
    memo: s.memo,
    cleared: s.cleared,
    flag: s.flag,
    errorMessage: s.errorMessage,
    dispatch: s.dispatch,
  }));

  const setPopupState = useSetAtom(popupStateAtom);
  const resetPopupState = useCallback(
    () => setPopupState({ view: "main" }),
    [setPopupState]
  );
  const setMemo = useCallback(
    (memo: SetStateAction<string>) => {
      dispatch({ type: "setMemo", memo });
    },
    [dispatch]
  );
  const memoRef = useRef<HTMLInputElement>(null);

  // Set default cleared state based on account type and budget settings
  useEffect(() => {
    if (cleared === undefined) {
      const defaultCleared =
        budgetMainData.accountsData?.find((a) => a.id === accountId)?.type === "cash" ||
        !!budgetSettings?.transactions.cleared;
      dispatch({ type: "setCleared", cleared: defaultCleared });
    }
  }, [cleared, accountId, budgetMainData, budgetSettings, dispatch]);

  if (!budgetMainData) return <div>Loading...</div>;

  return (
    <form className="flex-col" onSubmit={onSaveTransaction}>
      <div className="flex-col gap-0">
        <label className="flex-row">
          Split transaction?
          <IconButton
            role="switch"
            aria-checked={isSplit}
            icon={<Check color={isSplit ? "var(--currency-green)" : "#aaa"} />}
            onClick={() => dispatch({ type: "setIsSplit", isSplit: !isSplit })}
          />
        </label>
        <label className="flex-row">
          Transfer/Payment?
          <IconButton
            role="switch"
            aria-checked={isTransfer}
            icon={<Check color={isTransfer ? "var(--currency-green)" : "#aaa"} />}
            onClick={() => dispatch({ type: "setIsTransfer", isTransfer: !isTransfer })}
          />
        </label>
      </div>
      <AmountField
        amount={amount}
        amountType={amountType}
        disabled={isSaving}
        setAmount={(amount) => dispatch({ type: "setAmount", amount })}
        setAmountType={(amountType) => dispatch({ type: "setAmountType", amountType })}
      />
      {!isTransfer ? (
        <TransactionFormMain
          {...{
            dispatch,
            budgetMainData,
            budgetSettings,
            memoRef,
            isSaving,
          }}
        />
      ) : (
        <TransactionFormMainTransfer
          {...{
            dispatch,
            budgetMainData,
            memoRef,
            isSaving,
          }}
        />
      )}
      <MemoField
        ref={memoRef}
        memo={memo}
        setMemo={setMemo}
        disabled={isSaving}
        settings={settings}
      />
      {isSplit && (
        <TransactionFormSplit
          dispatch={dispatch}
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
            aria-checked={cleared}
            icon={
              <CircleC
                aria-hidden
                fill={cleared ? "var(--currency-green)" : "var(--background)"}
                color={cleared ? "var(--background)" : "gray"}
              />
            }
            onClick={() => dispatch({ type: "setCleared", cleared: !cleared })}
            disabled={isSaving}
          />
        </label>
        <label className="flex-row">
          Flag:
          <select
            className="select rounded"
            value={flag}
            onChange={(e) => dispatch({ type: "setFlag", flag: e.target.value })}
            disabled={isSaving}>
            <option value="">None</option>
            {Object.entries(TransactionFlagColor).map(([flagName, flagValue]) => (
              <option key={flagValue} value={flagValue}>
                {`${flagName} ${flagColorToEmoji(flagValue) || ""}`}
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
          value={date}
          max={getTodaysDateISO()}
          onChange={(e) => dispatch({ type: "setDate", date: e.target.value })}
          disabled={isSaving}
        />
      </label>
      <div className="text-error">{errorMessage}</div>
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
          onClick={resetPopupState}
          disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
