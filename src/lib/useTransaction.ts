import { type FormEventHandler, useEffect, useMemo, useState } from "react";
import { type Category, TransactionClearedStatus, TransactionFlagColor } from "ynab";

import { useStorageContext, useYNABContext } from "./context";
import type { CachedPayee } from "./types";
import {
  IS_PRODUCTION,
  executeScriptInCurrentTab,
  getTodaysDateISO,
  parseLocaleNumber,
  requestCurrentTabPermissions,
  stringValueToMillis
} from "./utils";

/** Utility hook for transaction form logic */
export default function useTransaction() {
  const { accountsData, categoriesData, addTransaction } = useYNABContext();
  const { settings, popupState, setPopupState } = useStorageContext();

  // Transaction state
  const [isTransfer, setIsTransfer] = useState(
    popupState.txAddState?.isTransfer ?? false
  );
  const [date, setDate] = useState(getTodaysDateISO);
  const [amount, setAmount] = useState(popupState.txAddState?.amount || "");
  const [cleared, setCleared] = useState(
    () =>
      accountsData?.find((a) => a.id === popupState.txAddState?.accountId)?.type ===
        "cash" || !!settings?.txCleared
  );
  const [amountType, setAmountType] = useState<"Inflow" | "Outflow">(
    popupState.txAddState?.amountType || "Outflow"
  );
  const [payee, setPayee] = useState<CachedPayee | { name: string } | null>(
    popupState.txAddState?.payee || null
  );
  const [category, setCategory] = useState(() => {
    if (!popupState.txAddState?.categoryId) return null;
    return (
      categoriesData?.find((c) => c.id === popupState.txAddState?.categoryId) || null
    );
  });
  const [account, setAccount] = useState(() => {
    if (!popupState.txAddState?.accountId) return null;
    return accountsData?.find((a) => a.id === popupState.txAddState?.accountId) || null;
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
  const onAddSubTx = () => {
    setSubTxs((prev) => [
      ...prev,
      { amount: "", amountType: "Outflow", payee: null, category: null }
    ]);
  };
  const onRemoveSubTx = () => {
    setSubTxs((prev) => prev.slice(0, -1));
  };
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
    requestCurrentTabPermissions().then((granted) => {
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
    return !transferToAccount.on_budget && account?.on_budget;
  }, [account?.on_budget, accountsData, isTransfer, payee]);

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
        approved: settings?.txApproved,
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
      setPopupState(popupState.txAddState?.returnTo || { view: "main" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error while saving transaction: ", err);
      setErrorMessage("Error adding transaction! " + (err?.error?.detail || ""));
    }
    setIsSaving(false);
  };

  return {
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
    totalSubTxsAmount,
    leftOverSubTxsAmount,
    isTransfer,
    isBudgetToTrackingTransfer,
    isSplit,
    isSaving,
    errorMessage,
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
    onRemoveSubTx,
    onSaveTransaction
  };
}
