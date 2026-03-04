import { type RefObject, useRef } from "react";

import { AccountSelect, CategorySelect, PayeeSelect } from "~components";
import type { BudgetMainData } from "~lib/types";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";

interface Props {
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
  budgetMainData: BudgetMainData;
  memoRef?: RefObject<HTMLInputElement | null>;
  isSaving: boolean;
}

/** Payee, category, and account fields for a non-transfer transaction */
export default function TransactionFormMain({
  formState,
  handlers,
  budgetMainData,
  memoRef,
  isSaving
}: Props) {
  const categoryRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <PayeeSelect
        payees={budgetMainData.payeesData}
        initialPayee={formState.payee}
        selectPayee={(selectedPayee) => {
          handlers.setPayee(selectedPayee);
          if ("id" in selectedPayee) {
            if (!formState.category && categoryRef.current) categoryRef.current.focus();
            else if (!formState.account) accountRef.current?.focus();
            else memoRef?.current?.focus();
          }
        }}
        disabled={isSaving}
      />
      {!formState.isSplit && (!formState.account || formState.account.on_budget) && (
        <CategorySelect
          ref={categoryRef}
          currentCategory={formState.category}
          categories={budgetMainData.categoriesData}
          categoryGroupsData={budgetMainData.categoryGroupsData}
          selectCategory={(selectedCategory) => {
            handlers.setCategory(selectedCategory);
            if (selectedCategory) {
              if (!formState.account) accountRef.current?.focus();
              else memoRef?.current?.focus();
            }
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
            memoRef?.current?.focus();
            if (selectedAccount.type === "cash") handlers.setCleared(true);
          }
        }}
        disabled={isSaving}
      />
    </>
  );
}
