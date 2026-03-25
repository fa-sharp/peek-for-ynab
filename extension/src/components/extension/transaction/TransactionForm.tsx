import { type SetStateAction, useCallback, useEffect, useRef } from "react";
import { CircleC } from "tabler-icons-react";

import { AmountField, IconButton, MemoField } from "~components";
import { CheckIcon as Check } from "~components/icons/ActionIcons";
import { TransactionFlags } from "~lib/api/client";
import { useStorageContext, useYNABContext } from "~lib/context";
import { useTxStore } from "~lib/state";
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
  const { settings, settingsSynced, budgetSettings } = useStorageContext();

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
          budgetSettings={budgetSettings}
          selectedBudgetData={selectedBudgetData}
          settings={settings}
          settingsSynced={settingsSynced}
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
  settingsSynced: boolean;
}

export function TransactionFormInner({
  budgetMainData,
  budgetSettings,
  selectedBudgetData,
  settings,
  settingsSynced,
}: Props) {
  const { onSaveTransaction, isSaving, onCancelTransaction } = useTransaction();

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

  const setMemo = useCallback(
    (memo: SetStateAction<string>) => {
      dispatch({ type: "setMemo", memo });
    },
    [dispatch]
  );
  const memoRef = useRef<HTMLInputElement>(null);

  // Set cash accounts as cleared by default, otherwise use budget settings
  useEffect(() => {
    if (budgetMainData.accountsData?.find((a) => a.id === accountId)?.type === "cash") {
      dispatch({ type: "setCleared", cleared: true });
    } else if (budgetSettings?.transactions.cleared) {
      dispatch({ type: "setCleared", cleared: budgetSettings.transactions.cleared });
    }
  }, [accountId, budgetMainData, budgetSettings?.transactions.cleared, dispatch]);

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
            budgetId: selectedBudgetData?.id,
            budgetMainData,
            budgetSettings,
            settings,
            settingsSynced,
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
            {Object.entries(TransactionFlags).map(([flagName, flagValue]) => (
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
          onClick={onCancelTransaction}
          disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
