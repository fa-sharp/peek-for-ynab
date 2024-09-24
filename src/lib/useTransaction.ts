import { type FormEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { type Category, TransactionClearedStatus, TransactionFlagColor } from "ynab";

import { IS_PRODUCTION } from "./constants";
import { useStorageContext, useYNABContext } from "./context";
import type { CachedPayee } from "./types";
import {
  executeScriptInCurrentTab,
  getTodaysDateISO,
  parseLocaleNumber,
  requestPermissions,
  stringValueToMillis
} from "./utils";

export type TransactionFormState = ReturnType<typeof useTransaction>["formState"];
export type TransactionFormHandlers = ReturnType<typeof useTransaction>["handlers"];

/** Utility hook for transaction form logic */
export default function useTransaction() {
  const { accountsData, categoriesData, addTransaction } = useYNABContext();
  const {
    settings,
    budgetSettings,
    popupState: { txAddState },
    setPopupState,
    setBudgetSettings
  } = useStorageContext();

  // Transaction state
  const [isTransfer, setIsTransfer] = useState(txAddState?.isTransfer ?? false);
  const [date, setDate] = useState(getTodaysDateISO);
  const [amount, setAmount] = useState(txAddState?.amount || "");
  const [cleared, setCleared] = useState(
    () =>
      accountsData?.find((a) => a.id === txAddState?.accountId)?.type === "cash" ||
      !!budgetSettings?.transactions.cleared
  );
  const [amountType, setAmountType] = useState<"Inflow" | "Outflow">(
    txAddState?.amountType || "Outflow"
  );
  const [payee, setPayee] = useState<CachedPayee | { name: string } | null>(
    txAddState?.payee || null
  );
  const [category, setCategory] = useState(() => {
    if (!txAddState?.categoryId) return null;
    return categoriesData?.find((c) => c.id === txAddState?.categoryId) || null;
  });
  const [account, setAccount] = useState(() => {
    if (txAddState?.accountId)
      return accountsData?.find((a) => a.id === txAddState?.accountId) || null;
    if (budgetSettings?.transactions.defaultAccountId)
      return (
        accountsData?.find(
          (a) => a.id === budgetSettings.transactions.defaultAccountId
        ) || null
      );
    return null;
  });
  const [memo, setMemo] = useState("");
  const [flag, setFlag] = useState("");

  // Split transaction state
  const [isSplit, setIsSplit] = useState(false);
  const [subTxs, setSubTxs] = useState<
    Array<{
      amount: string;
      amountType: "Inflow" | "Outflow";
      payee: CachedPayee | { name: string } | null;
      category: Category | null;
      memo?: string;
    }>
  >([{ amount: "", amountType: "Outflow", payee: null, category: null }]);
  const onAddSubTx = useCallback(() => {
    setSubTxs((prev) => [
      ...prev,
      { amount: "", amountType: "Outflow", payee: null, category: null }
    ]);
  }, []);
  const onRemoveSubTx = useCallback(() => {
    setSubTxs((prev) => prev.slice(0, -1));
  }, []);
  const totalSubTxsAmount = useMemo(
    () =>
      subTxs.reduce((sum, tx) => sum + stringValueToMillis(tx.amount, tx.amountType), 0),
    [subTxs]
  );
  const leftOverSubTxsAmount = useMemo(
    () => stringValueToMillis(amount, amountType) - totalSubTxsAmount,
    [amount, amountType, totalSubTxsAmount]
  );

  // Other form state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Try parsing user's selection as the amount upon opening the form
  useEffect(() => {
    if (!settings?.currentTabAccess) return;
    requestPermissions(["activeTab", "scripting"]).then((granted) => {
      if (!granted) return;
      executeScriptInCurrentTab(() => getSelection()?.toString())
        .then((selection) => {
          if (!selection) return;
          const parsedNumber = parseLocaleNumber(selection);
          if (!isNaN(parsedNumber)) setAmount(parsedNumber.toString());
        })
        .catch((err) => {
          !IS_PRODUCTION && console.error("Error getting user's selection: ", err);
        });
    });
  }, [settings?.currentTabAccess]);

  /** Whether this is a budget to tracking account transfer. We'll want a category for these transactions. */
  const isBudgetToTrackingTransfer = useMemo(() => {
    if (!isTransfer || !payee || !("id" in payee) || !payee.transferId) return false;
    const transferToAccount = accountsData?.find((a) => a.id === payee.transferId);
    if (!transferToAccount) return false;
    return !transferToAccount.on_budget && !!account?.on_budget;
  }, [account?.on_budget, accountsData, isTransfer, payee]);

  const handlers = useMemo(
    () => ({
      setDate,
      setAmount,
      setAmountType,
      setPayee,
      setCategory,
      setAccount,
      setFlag,
      setMemo,
      setCleared,
      setSubTxs,
      setIsTransfer,
      setIsSplit,
      onAddSubTx,
      onRemoveSubTx
    }),
    [onAddSubTx, onRemoveSubTx]
  );

  const onSaveTransaction: FormEventHandler = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!account) {
      setErrorMessage("Please select an account!");
      return;
    }
    if (!payee) {
      setErrorMessage("Please enter a payee!");
      return;
    }
    if (!amount) {
      setErrorMessage("Please enter a valid amount!");
      return;
    }
    if (isTransfer) {
      if (!("transferId" in payee)) {
        setErrorMessage("'To' account is not valid!");
        return;
      }
      if (payee.transferId === account.id) {
        setErrorMessage("Can't transfer to the same account!");
        return;
      }
      if (isSplit && !isBudgetToTrackingTransfer) {
        setErrorMessage("This transfer can't be a split transaction!");
        return;
      }
    }
    if (isSplit) {
      if (
        subTxs.some(
          (tx) =>
            tx.payee && "id" in tx.payee && tx.payee.id === account.transfer_payee_id
        )
      ) {
        setErrorMessage("Can't transfer to the same account!");
        return;
      }
      if (leftOverSubTxsAmount !== 0) {
        setErrorMessage("Total of splits doesn't match amount!");
        return;
      }
    }
    if (
      budgetSettings?.transactions.rememberAccount &&
      account.id !== budgetSettings.transactions.defaultAccountId
    )
      setBudgetSettings(
        (prev) =>
          prev && {
            ...prev,
            transactions: { ...prev.transactions, defaultAccountId: account.id }
          }
      );

    setIsSaving(true);
    try {
      await addTransaction({
        date,
        amount: stringValueToMillis(amount, amountType),
        payee_id: "id" in payee ? payee.id : undefined,
        payee_name: "id" in payee ? undefined : payee.name,
        account_id: account.id,
        category_id:
          (!isTransfer || isBudgetToTrackingTransfer) && !isSplit
            ? category?.id
            : undefined,
        cleared: cleared
          ? TransactionClearedStatus.Cleared
          : TransactionClearedStatus.Uncleared,
        approved: budgetSettings?.transactions.approved,
        memo,
        flag_color: flag ? (flag as unknown as TransactionFlagColor) : undefined,
        subtransactions: isSplit
          ? subTxs.map((subTx) => ({
              amount: stringValueToMillis(subTx.amount, subTx.amountType),
              category_id: subTx.category?.id,
              payee_id: subTx.payee && "id" in subTx.payee ? subTx.payee.id : undefined,
              payee_name:
                subTx.payee && "id" in subTx.payee ? undefined : subTx.payee?.name,
              memo: subTx.memo
            }))
          : undefined
      });
      setPopupState(txAddState?.returnTo || { view: "main" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error while saving transaction: ", err);
      setErrorMessage("Error adding transaction! " + (err?.error?.detail || ""));
    }
    setIsSaving(false);
  };

  return {
    isSaving,
    onSaveTransaction,
    handlers,
    formState: {
      date,
      amount,
      amountType,
      payee,
      category,
      account,
      flag,
      memo,
      cleared,
      subTxs,
      isSplit,
      isTransfer,
      errorMessage
    },
    derivedState: {
      totalSubTxsAmount,
      leftOverSubTxsAmount,
      isBudgetToTrackingTransfer
    }
  };
}
