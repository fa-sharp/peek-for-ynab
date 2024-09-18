import { type RefObject, useRef } from "react";
import type { Account, Category } from "ynab";

import { AccountSelect, CategorySelect, PayeeSelect } from "~components";
import type { CachedPayee } from "~lib/context/ynabContext";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";

interface Props {
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
  accountsData?: Account[];
  categoriesData?: Category[];
  payeesData?: CachedPayee[];
  memoRef: RefObject<HTMLInputElement>;
  isSaving: boolean;
}

export default function TransactionFormMain({
  formState,
  handlers,
  accountsData,
  categoriesData,
  payeesData,
  memoRef,
  isSaving
}: Props) {
  const categoryRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <PayeeSelect
        payees={payeesData}
        selectPayee={(selectedPayee) => {
          handlers.setPayee(selectedPayee);
          if ("id" in selectedPayee) {
            if (!formState.category && categoryRef.current) categoryRef.current.focus();
            else if (!formState.account) accountRef.current?.focus();
            else memoRef.current?.focus();
          }
        }}
        disabled={isSaving}
      />
      {!formState.isSplit && (!formState.account || formState.account.on_budget) && (
        <CategorySelect
          ref={categoryRef}
          initialCategory={formState.category}
          categories={categoriesData}
          selectCategory={(selectedCategory) => {
            handlers.setCategory(selectedCategory);
            if (selectedCategory) {
              if (!formState.account) accountRef.current?.focus();
              else memoRef.current?.focus();
            }
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
            memoRef.current?.focus();
            if (selectedAccount.type === "cash") handlers.setCleared(true);
          }
        }}
        disabled={isSaving}
      />
    </>
  );
}
