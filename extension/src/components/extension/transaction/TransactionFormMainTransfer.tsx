import { type RefObject, useCallback, useMemo, useRef } from "react";

import { AccountSelect, CategorySelect } from "~components";
import type { Account, Category } from "~lib/api/client";
import { useTxStore, useTxStoreSubTxTotals } from "~lib/state";
import type { BudgetMainData } from "~lib/types";
import type { TransactionFormDispatch } from "~lib/useTransaction";

interface Props {
  dispatch: TransactionFormDispatch;
  budgetMainData: BudgetMainData;
  memoRef?: RefObject<HTMLInputElement | null>;
  isSaving: boolean;
}

/** Payee, category, and account fields for a transfer transaction */
export default function TransactionFormMainTransfer({
  dispatch,
  budgetMainData,
  memoRef,
  isSaving,
}: Props) {
  const categoryRef = useRef<HTMLInputElement>(null);
  const secondAccountRef = useRef<HTMLInputElement>(null);

  const { payee, isSplit, amountType, categoryId, accountId } = useTxStore((s) => ({
    payee: s.payee,
    isSplit: s.isSplit,
    amountType: s.amountType,
    categoryId: s.categoryId,
    accountId: s.accountId,
  }));
  const { totalSubTxsAmount } = useTxStoreSubTxTotals();

  const payeeDirection: "to" | "from" = useMemo(() => {
    return (!isSplit && amountType === "Outflow") || (isSplit && totalSubTxsAmount <= 0)
      ? "to"
      : "from";
  }, [isSplit, amountType, totalSubTxsAmount]);

  const firstAccount = useMemo(() => {
    return payee && "transferId" in payee
      ? budgetMainData.accountsData?.find(
          (a) => a.id === (payee as { transferId: string }).transferId
        ) || null
      : null;
  }, [payee, budgetMainData.accountsData]);
  const secondAccount = useMemo(
    () => budgetMainData.accountsData.find((a) => a.id === accountId),
    [budgetMainData.accountsData, accountId]
  );
  const isBudgetToTracking = useMemo(() => {
    if (!firstAccount || !secondAccount) return false;
    return secondAccount.on_budget && !firstAccount.on_budget;
  }, [firstAccount, secondAccount]);
  const category = useMemo(
    () => budgetMainData.categoriesData.find((c) => c.id === categoryId),
    [budgetMainData.categoriesData, categoryId]
  );

  const selectFirstAccount = useCallback(
    (selectedAccount: Account | null) => {
      if (!selectedAccount || !selectedAccount.transfer_payee_id) {
        dispatch({ type: "setPayee", payee: null });
        return;
      }
      dispatch({
        type: "setPayee",
        payee: {
          id: selectedAccount.transfer_payee_id,
          name: selectedAccount.name,
          transferId: selectedAccount.id,
        },
      });
      if (selectedAccount) {
        if (!secondAccount) secondAccountRef.current?.focus();
        else if (!selectedAccount.on_budget && secondAccount.on_budget && !category)
          setTimeout(() => categoryRef.current?.focus(), 50);
        else memoRef?.current?.focus();
      }
    },
    [secondAccount, category, dispatch, memoRef]
  );
  const selectSecondAccount = useCallback(
    (account: Account | null) => {
      dispatch({ type: "setAccount", accountId: account?.id || null });
      if (account) {
        setTimeout(() => {
          if (categoryRef.current) categoryRef.current.focus();
          else memoRef?.current?.focus();
        }, 50);
        if (account.type === "cash") dispatch({ type: "setCleared", cleared: true });
      }
    },
    [memoRef, dispatch]
  );
  const selectCategory = useCallback(
    (category: Category | null) => {
      dispatch({ type: "setCategory", categoryId: category?.id || null });
      if (category) memoRef?.current?.focus();
    },
    [memoRef, dispatch]
  );

  return (
    <>
      <AccountSelect
        accounts={budgetMainData.accountsData}
        currentAccount={firstAccount}
        selectAccount={selectFirstAccount}
        label={payeeDirection === "to" ? "Payee (To)" : "Payee (From)"}
        disabled={isSaving}
      />
      {!isSplit && isBudgetToTracking && (
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
        ref={secondAccountRef}
        currentAccount={secondAccount}
        accounts={budgetMainData.accountsData}
        selectAccount={selectSecondAccount}
        label={payeeDirection === "to" ? "Account (From)" : "Account (To)"}
        disabled={isSaving}
      />
    </>
  );
}
