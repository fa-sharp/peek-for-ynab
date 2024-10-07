import { type RefObject, useRef } from "react";

import { AccountSelect, CategorySelect } from "~components";
import type { BudgetMainData } from "~lib/types";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";

interface Props {
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
  totalSubTxsAmount: number;
  isBudgetToTrackingTransfer: boolean;
  budgetMainData: BudgetMainData;
  memoRef?: RefObject<HTMLInputElement>;
  isSaving: boolean;
}

/** Payee, category, and account fields for a transfer transaction */
export default function TransactionFormMainTransfer({
  formState,
  handlers,
  budgetMainData,
  totalSubTxsAmount,
  isBudgetToTrackingTransfer,
  memoRef,
  isSaving
}: Props) {
  const categoryRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);

  const payeeDirection: "to" | "from" =
    (!formState.isSplit && formState.amountType === "Outflow") ||
    (formState.isSplit && totalSubTxsAmount <= 0)
      ? "to"
      : "from";

  return (
    <>
      <AccountSelect
        accounts={budgetMainData.accountsData}
        currentAccount={
          formState.payee && "transferId" in formState.payee
            ? budgetMainData.accountsData?.find(
                (a) => a.id === (formState.payee as { transferId: string }).transferId
              ) || null
            : null
        }
        selectAccount={(selectedAccount) => {
          if (!selectedAccount || !selectedAccount.transfer_payee_id) {
            handlers.setPayee(null);
            return;
          }
          handlers.setPayee({
            id: selectedAccount.transfer_payee_id,
            name: selectedAccount.name,
            transferId: selectedAccount.id
          });
          if (selectedAccount) {
            if (!formState.account) accountRef.current?.focus();
            else if (
              !selectedAccount.on_budget &&
              formState.account.on_budget &&
              !formState.category
            )
              setTimeout(() => categoryRef.current?.focus(), 50);
            else memoRef?.current?.focus();
          }
        }}
        label={payeeDirection === "to" ? "Payee (To)" : "Payee (From)"}
        disabled={isSaving}
      />
      {!formState.isSplit && isBudgetToTrackingTransfer && (
        <CategorySelect
          ref={categoryRef}
          initialCategory={formState.category}
          categories={budgetMainData.categoriesData}
          categoryGroupsData={budgetMainData.categoryGroupsData}
          selectCategory={(selectedCategory) => {
            handlers.setCategory(selectedCategory);
            if (selectedCategory) memoRef?.current?.focus();
          }}
          disabled={isSaving}
        />
      )}
      <AccountSelect
        ref={accountRef}
        currentAccount={formState.account}
        accounts={budgetMainData.accountsData}
        selectAccount={(selectedAccount) => {
          handlers.setAccount(selectedAccount);
          if (selectedAccount) {
            setTimeout(() => {
              if (categoryRef.current) categoryRef.current.focus();
              else memoRef?.current?.focus();
            }, 50);
            if (selectedAccount.type === "cash") handlers.setCleared(true);
          }
        }}
        label={payeeDirection === "to" ? "Account (From)" : "Account (To)"}
        disabled={isSaving}
      />
    </>
  );
}
