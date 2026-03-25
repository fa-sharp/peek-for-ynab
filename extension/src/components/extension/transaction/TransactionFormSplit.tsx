import { CurrencyView, SubTransaction } from "~components";
import type { CurrencyFormat } from "~lib/api/client";
import { useTxStore, useTxStoreSubTxTotals } from "~lib/state";
import type { BudgetMainData } from "~lib/types";
import type { TransactionFormDispatch } from "~lib/useTransaction";

interface Props {
  dispatch: TransactionFormDispatch;
  currencyFormat?: CurrencyFormat;
  isSaving: boolean;
  budgetMainData: BudgetMainData;
}

export default function TransactionFormSplit({
  dispatch,
  currencyFormat,
  isSaving,
  budgetMainData,
}: Props) {
  const { isTransfer, subTxs } = useTxStore((s) => ({
    isTransfer: s.isTransfer,
    subTxs: s.subTxs,
  }));
  const { totalSubTxsAmount, leftOverSubTxsAmount } = useTxStoreSubTxTotals();

  return (
    <>
      {subTxs?.map((subTx, idx) => (
        <SubTransaction
          key={idx}
          splitIndex={idx}
          txState={subTx}
          autoFocus={idx > 0}
          allowTransfer={!isTransfer}
          disabled={isSaving}
          budgetMainData={budgetMainData}
          setField={(field, val) =>
            dispatch({
              type: "editSubTx",
              idx,
              update: (tx) => ({ ...tx, [field]: val }),
            })
          }
        />
      ))}
      <div className="flex-row mt-md">
        <button
          type="button"
          className="button accent rounded flex-1"
          onClick={() => dispatch({ type: "addSubTx" })}>
          Add split
        </button>
        {subTxs && subTxs.length > 1 && (
          <button
            type="button"
            className="button warn rounded flex-1"
            onClick={() => dispatch({ type: "removeSubTx" })}>
            Remove split
          </button>
        )}
      </div>
      <div>
        <div className="heading-small balance-display">
          Total of splits:
          <CurrencyView
            milliUnits={totalSubTxsAmount}
            currencyFormat={currencyFormat}
            colorsEnabled
          />
        </div>
        <div className="heading-small balance-display">
          Amount remaining:
          <CurrencyView
            milliUnits={leftOverSubTxsAmount}
            currencyFormat={currencyFormat}
            colorsEnabled
          />
        </div>
      </div>
    </>
  );
}
