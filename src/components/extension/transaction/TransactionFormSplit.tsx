import type { CurrencyFormat } from "ynab";

import { CurrencyView, SubTransaction } from "~components";
import type { BudgetMainData } from "~lib/types";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";

interface Props {
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
  totalSubTxsAmount: number;
  leftOverSubTxsAmount: number;
  currencyFormat?: CurrencyFormat;
  isSaving: boolean;
  budgetMainData: BudgetMainData;
}

export default function TransactionFormSplit({
  formState,
  handlers,
  totalSubTxsAmount,
  leftOverSubTxsAmount,
  currencyFormat,
  isSaving,
  budgetMainData
}: Props) {
  return (
    <>
      {formState.subTxs.map((subTx, idx) => (
        <SubTransaction
          key={idx}
          splitIndex={idx}
          txState={subTx}
          autoFocus={idx > 0}
          allowTransfer={!formState.isTransfer}
          disabled={isSaving}
          budgetMainData={budgetMainData}
          setAmount={(newAmount) =>
            handlers.setSubTxs((prev) =>
              prev.with(idx, {
                ...prev[idx],
                amount: newAmount
              })
            )
          }
          setAmountType={(newAmountType) =>
            handlers.setSubTxs((prev) =>
              prev.with(idx, {
                ...prev[idx],
                amountType: newAmountType
              })
            )
          }
          setCategory={(newCategory) =>
            handlers.setSubTxs((prev) =>
              prev.with(idx, {
                ...prev[idx],
                categoryId: newCategory?.id
              })
            )
          }
          setPayee={(newPayee) =>
            handlers.setSubTxs((prev) =>
              prev.with(idx, {
                ...prev[idx],
                payee: newPayee
              })
            )
          }
          setIsTransfer={(isTransfer) =>
            handlers.setSubTxs((prev) =>
              prev.with(idx, {
                ...prev[idx],
                isTransfer
              })
            )
          }
          setMemo={(newMemo) =>
            handlers.setSubTxs((prev) =>
              prev.with(idx, {
                ...prev[idx],
                memo: newMemo
              })
            )
          }
        />
      ))}
      <div className="flex-row mt-md">
        <button
          type="button"
          className="button accent rounded flex-1"
          onClick={handlers.onAddSubTx}>
          Add split
        </button>
        {formState.subTxs.length > 1 && (
          <button
            type="button"
            className="button warn rounded flex-1"
            onClick={handlers.onRemoveSubTx}>
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
