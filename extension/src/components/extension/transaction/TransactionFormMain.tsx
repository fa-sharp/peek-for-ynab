import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";

import { AccountSelect, CategorySelect, PayeeSelect } from "~components";
import type { Account, Category } from "~lib/api/client";
import { useTxStore } from "~lib/state";
import type {
  AppSettings,
  BudgetMainData,
  BudgetSettings,
  CachedPayee,
} from "~lib/types";
import useRememberPayee from "~lib/useRememberPayee";
import type { TransactionFormDispatch } from "~lib/useTransaction";

interface Props {
  dispatch: TransactionFormDispatch;
  budgetId?: string;
  budgetMainData: BudgetMainData;
  budgetSettings?: BudgetSettings;
  settings?: AppSettings;
  settingsSynced: boolean;
  memoRef?: RefObject<HTMLInputElement | null>;
  isSaving: boolean;
}

/** Payee, category, and account fields for a non-transfer transaction */
export default function TransactionFormMain({
  dispatch,
  budgetId,
  budgetMainData,
  budgetSettings,
  settings,
  settingsSynced,
  memoRef,
  isSaving,
}: Props) {
  const { payee, isSplit, categoryId, accountId } = useTxStore((s) => ({
    payee: s.payee,
    isSplit: s.isSplit,
    categoryId: s.categoryId,
    accountId: s.accountId,
  }));
  const category = useMemo(() => {
    return budgetMainData.categoriesData.find((c) => c.id === categoryId);
  }, [budgetMainData.categoriesData, categoryId]);
  const account = useMemo(() => {
    return budgetMainData.accountsData.find((a) => a.id === accountId);
  }, [budgetMainData.accountsData, accountId]);

  const categoryRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);

  const selectPayee = useCallback(
    (selectedPayee: CachedPayee | { name: string }) => {
      dispatch({ type: "setPayee", payee: selectedPayee });
      if ("id" in selectedPayee) {
        if (!category && categoryRef.current) categoryRef.current.focus();
        else if (!account) accountRef.current?.focus();
        else memoRef?.current?.focus();
      }
    },
    [dispatch, category, account, memoRef]
  );
  const selectCategory = useCallback(
    (selectedCategory: Category | null) => {
      dispatch({ type: "setCategory", categoryId: selectedCategory?.id || null });
      if (selectedCategory) {
        if (!account) accountRef.current?.focus();
        else memoRef?.current?.focus();
      }
    },
    [dispatch, account, memoRef]
  );
  const selectAccount = useCallback(
    (selectedAccount: Account | null) => {
      dispatch({ type: "setAccount", accountId: selectedAccount?.id || null });
      if (selectedAccount) {
        memoRef?.current?.focus();
        if (selectedAccount.type === "cash")
          dispatch({ type: "setCleared", cleared: true });
      }
    },
    [dispatch, memoRef]
  );

  // If no account is selected, select the default account if there is one
  useEffect(() => {
    if (accountId === undefined && budgetSettings?.transactions.defaultAccountId) {
      const defaultAccount = budgetMainData.accountsData.find(
        (a) => a.id === budgetSettings.transactions.defaultAccountId
      );
      if (defaultAccount) dispatch({ type: "setAccount", accountId: defaultAccount.id });
    }
  }, [
    accountId,
    budgetMainData.accountsData,
    budgetSettings?.transactions.defaultAccountId,
    dispatch,
  ]);

  // Get website host and use saved payees if enabled
  const { host, isRememberedPayee, canRememberPayee, onToggleRememberPayee } =
    useRememberPayee(
      !!settings?.currentTabAccess,
      budgetId ?? "",
      budgetMainData,
      settingsSynced,
      dispatch,
      payee
    );

  return (
    <>
      <PayeeSelect
        payees={budgetMainData.payeesData}
        currentPayee={payee}
        selectPayee={selectPayee}
        disabled={isSaving}
      />
      {canRememberPayee && (
        <label className="flex-row">
          <input
            type="checkbox"
            checked={isRememberedPayee}
            onChange={onToggleRememberPayee}
          />
          Remember payee for '{host}'
        </label>
      )}
      {!isSplit && (!account || account.on_budget) && (
        <CategorySelect
          ref={categoryRef}
          currentCategory={category}
          categories={budgetMainData.categoriesData}
          categoryGroupsData={budgetMainData.categoryGroupsData}
          selectCategory={selectCategory}
          disabled={isSaving}
        />
      )}
      <AccountSelect
        ref={accountRef}
        currentAccount={account}
        accounts={budgetMainData.accountsData}
        currencyFormat={budgetMainData.currencyFormat}
        selectAccount={selectAccount}
        disabled={isSaving}
      />
    </>
  );
}
