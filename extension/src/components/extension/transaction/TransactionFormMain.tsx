import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AccountSelect, CategorySelect, PayeeSelect } from "~components";
import type { Account, Category } from "~lib/api/client";
import { useSavedPayees, useTxStore } from "~lib/state";
import type {
  AppSettings,
  BudgetMainData,
  BudgetSettings,
  CachedPayee,
} from "~lib/types";
import type { TransactionFormDispatch } from "~lib/useTransaction";
import { executeScriptInCurrentTab } from "~lib/utils";

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

  // If no account is selected, select the default account if available
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

  const { savePayeeForUrl, forgetPayeeForUrl, getSavedPayeeForUrl } = useSavedPayees(
    budgetId ?? "",
    settingsSynced
  );
  const [host, setHost] = useState<string | null>(null);
  const isRememberedPayee = useMemo(
    () => !!host && !!payee && "id" in payee && getSavedPayeeForUrl(host) === payee.id,
    [host, payee, getSavedPayeeForUrl]
  );

  /** Toggle whether to remember the payee for the current website host */
  const onToggleRememberPayee = useCallback(() => {
    if (!host || !payee || !("id" in payee)) return;
    if (isRememberedPayee) forgetPayeeForUrl(host);
    else savePayeeForUrl(payee.id, host);
  }, [host, payee, isRememberedPayee, savePayeeForUrl, forgetPayeeForUrl]);

  // Get current tab's URL host if permission is granted
  useEffect(() => {
    if (!settings?.currentTabAccess) return;
    executeScriptInCurrentTab(() => location.host)
      .then((host) => {
        const strippedHost = host.replace(/^www\./, "");
        setHost(strippedHost);
      })
      .catch((err) => {
        console.warn("Failed to get current tab host:", err);
      });
  }, [settings?.currentTabAccess]);

  // If no payee is selected, select remembered payee if available
  useEffect(() => {
    if (payee !== undefined || !host) return;
    const payeeId = getSavedPayeeForUrl(host);
    if (payeeId) {
      const savedPayee = budgetMainData.payeesData.find((p) => p.id === payeeId);
      if (savedPayee) dispatch({ type: "setPayee", payee: savedPayee });
    }
  }, [payee, host, getSavedPayeeForUrl, dispatch, budgetMainData]);

  return (
    <>
      <PayeeSelect
        payees={budgetMainData.payeesData}
        currentPayee={payee}
        selectPayee={selectPayee}
        disabled={isSaving}
      />
      {payee && "id" in payee && host && (
        <label className="flex-row gap-sn">
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
