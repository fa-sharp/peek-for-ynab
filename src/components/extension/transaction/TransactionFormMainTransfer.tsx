import { type RefObject, useRef } from "react";
import type { Account, Category } from "ynab";

import { AccountSelect, CategorySelect } from "~components";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";

interface Props {
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
  totalSubTxsAmount: number;
  isBudgetToTrackingTransfer: boolean;
  accountsData?: Account[];
  categoriesData?: Category[];
  memoRef: RefObject<HTMLInputElement>;
  isSaving: boolean;
}

/** Payee, category, and account fields for a transfer transaction */
export default function TransactionFormMainTransfer({
  formState,
  handlers,
  accountsData,
  categoriesData,
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
        accounts={accountsData}
        currentAccount={
          formState.payee && "transferId" in formState.payee
            ? accountsData?.find(
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
            else memoRef.current?.focus();
          }
        }}
        label={payeeDirection === "to" ? "Payee (To)" : "Payee (From)"}
        disabled={isSaving}
      />
      {!formState.isSplit && isBudgetToTrackingTransfer && (
        <CategorySelect
          ref={categoryRef}
          initialCategory={formState.category}
          categories={categoriesData}
          selectCategory={(selectedCategory) => {
            handlers.setCategory(selectedCategory);
            if (selectedCategory) memoRef.current?.focus();
          }}
          disabled={isSaving}
        />
      )}
      <AccountSelect
        ref={accountRef}
        currentAccount={formState.account}
        accounts={accountsData}
        selectAccount={(selectedAccount) => {
          handlers.setAccount(selectedAccount);
          if (selectedAccount) {
            setTimeout(() => {
              if (categoryRef.current) categoryRef.current.focus();
              else memoRef.current?.focus();
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
