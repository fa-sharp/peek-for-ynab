import { useMemo, useRef, useState } from "react";
import type { FormEventHandler, MouseEventHandler } from "react";
import { useEffect } from "react";
import { Check, CircleC, Minus, Plus, WorldWww } from "tabler-icons-react";
import { TransactionClearedStatus, TransactionFlagColor } from "ynab";

import { useStorageContext, useYNABContext } from "~lib/context";
import type { CachedPayee } from "~lib/context/ynabContext";
import {
  IS_PRODUCTION,
  executeScriptInCurrentTab,
  flagColorToEmoji,
  getTodaysDateISO,
  parseLocaleNumber,
  requestCurrentTabPermissions
} from "~lib/utils";

import { AccountSelect, CategorySelect, IconButton, PayeeSelect } from ".";

/** Form that lets user add a transaction. */
export default function TransactionAdd() {
  const { accountsData, categoriesData, payeesData, addTransaction } = useYNABContext();
  const { settings, popupState, setPopupState } = useStorageContext();

  const [isTransfer, setIsTransfer] = useState(
    popupState.txAddState?.isTransfer ?? false
  );
  const [date, setDate] = useState(getTodaysDateISO);
  const [amount, setAmount] = useState(popupState.txAddState?.amount || "");
  const [cleared, setCleared] = useState(settings?.txCleared ? true : false);
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

  const categoryRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Try parsing user's selection as the amount
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

  /** The CCP category if this is a credit card payment. We'll want to show the CCP balance. */
  // const ccpCategory = useMemo(() => {
  //   if (!isTransfer || !payee || !("id" in payee) || !payee.transferId) return;
  //   const transferToAccount = accountsData?.find((a) => a.id === payee.transferId);
  //   const isCreditCardPayment =
  //     (!account || account.on_budget) &&
  //     transferToAccount &&
  //     (transferToAccount.type === "creditCard" ||
  //       transferToAccount.type === "lineOfCredit");
  //   if (!isCreditCardPayment) return;
  //   return categoriesData?.find(
  //     (c) =>
  //       c.category_group_name === "Credit Card Payments" &&
  //       c.name === transferToAccount.name
  //   );
  // }, [account, accountsData, categoriesData, isTransfer, payee]);

  // TODO find a better way to detect amounts
  // const [detectedAmounts, setDetectedAmounts] = useState<number[] | null>(null);
  // const [detectedAmountIdx, setDetectedAmountIdx] = useState(0);
  // // const onDetectAmount = async () => {
  //   if (!detectedAmounts) {
  //     // Check permissions
  //     if (!(await requestCurrentTabPermissions())) return;
  //     // Try detecting any currency amounts on the page
  //     const amounts = await executeScriptInCurrentTab(extractCurrencyAmounts);
  //     !IS_PRODUCTION && console.log({ detectedAmounts: amounts });
  //     setDetectedAmounts(amounts);
  //     if (amounts[0]) setAmount(amounts[0].toString());
  //   } else if (detectedAmounts[detectedAmountIdx + 1]) {
  //     // Iterate through detected amounts
  //     setAmount(detectedAmounts[detectedAmountIdx + 1].toString());
  //     setDetectedAmountIdx((v) => v + 1);
  //   } else {
  //     if (detectedAmounts[0]) setAmount(detectedAmounts[0].toString());
  //     setDetectedAmountIdx(0);
  //   }
  // };

  const onCopyURLIntoMemo = async () => {
    if (!(await requestCurrentTabPermissions())) return;
    const url = await executeScriptInCurrentTab(() => location.href);
    setMemo((memo) => memo + url);
  };

  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType((prev) => (prev === "Inflow" ? "Outflow" : "Inflow"));
  };

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
    }
    setIsSaving(true);
    try {
      await addTransaction({
        date,
        amount:
          amountType === "Outflow"
            ? Math.round(+amount * -1000)
            : Math.round(+amount * 1000),
        payee_id: "id" in payee ? payee.id : undefined,
        payee_name: "id" in payee ? undefined : payee.name,
        account_id: account.id,
        category_id: !isTransfer || isBudgetToTrackingTransfer ? category?.id : undefined,
        cleared: cleared
          ? TransactionClearedStatus.Cleared
          : TransactionClearedStatus.Uncleared,
        approved: settings?.txApproved,
        memo,
        flag_color: flag ? (flag as unknown as TransactionFlagColor) : undefined
      });
      setPopupState({ view: "main" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error while saving transaction: ", err);
      setErrorMessage("Error adding transaction! " + (err?.error?.detail || ""));
    }
    setIsSaving(false);
  };

  return (
    <section>
      <div className="heading-big">
        <div role="heading">Add Transaction</div>
      </div>
      <form className="flex-col" onSubmit={onSaveTransaction}>
        <label className="flex-row">
          Transfer/Payment?
          {isTransfer ? (
            <IconButton
              label="Transfer (click to switch)"
              icon={<Check color="var(--currency-green)" />}
              onClick={() => setIsTransfer(false)}
            />
          ) : (
            <IconButton
              label="Not a transfer (click to switch)"
              icon={<Check color="#aaa" />}
              onClick={() => setIsTransfer(true)}
            />
          )}
        </label>
        <label className="form-input" htmlFor="amount-input">
          Amount
          <div className="flex-row">
            <IconButton
              label={`${
                amountType === "Inflow" ? "Inflow" : "Outflow"
              } (Click to switch)`}
              icon={
                amountType === "Inflow" ? (
                  <Plus color="var(--currency-green)" />
                ) : (
                  <Minus color="var(--currency-red)" />
                )
              }
              onClick={flipAmountType}
            />
            <input
              id="amount-input"
              required
              autoFocus
              aria-label="Amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.001"
              placeholder="0.00"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </label>
        {!isTransfer ? (
          <>
            <PayeeSelect
              payees={payeesData}
              selectPayee={(selectedPayee) => {
                setPayee(selectedPayee);
                if ("id" in selectedPayee) {
                  if (!category) categoryRef.current?.focus();
                  else if (!account) accountRef.current?.focus();
                  else memoRef.current?.focus();
                }
              }}
              disabled={isSaving}
            />
            <CategorySelect
              ref={categoryRef}
              initialCategory={category}
              categories={categoriesData}
              selectCategory={(selectedCategory) => {
                setCategory(selectedCategory);
                if (selectedCategory) {
                  if (!account) accountRef.current?.focus();
                  else memoRef.current?.focus();
                }
              }}
              disabled={isSaving}
            />
            <AccountSelect
              ref={accountRef}
              currentAccount={account}
              accounts={accountsData}
              selectAccount={(selectedAccount) => {
                setAccount(selectedAccount);
                if (selectedAccount) memoRef.current?.focus();
              }}
              disabled={isSaving}
            />
          </>
        ) : (
          <>
            <AccountSelect
              accounts={accountsData}
              currentAccount={
                payee && "transferId" in payee
                  ? accountsData?.find((a) => a.id === payee.transferId) || null
                  : null
              }
              selectAccount={(selectedAccount) => {
                if (!selectedAccount || !selectedAccount.transfer_payee_id) {
                  setPayee(null);
                  return;
                }
                setPayee({
                  id: selectedAccount.transfer_payee_id,
                  name: selectedAccount.name,
                  transferId: selectedAccount.id
                });
                if (selectedAccount) {
                  if (!account) accountRef.current?.focus();
                  else if (!selectedAccount.on_budget && account.on_budget && !category)
                    setTimeout(() => categoryRef.current?.focus(), 50);
                  else memoRef.current?.focus();
                }
              }}
              label={amountType === "Outflow" ? "Payee (To)" : "Payee (From)"}
              disabled={isSaving}
            />
            {/* {ccpCategory && (
              <div>
                Payment category:{" "}
                <button
                  type="button"
                  className="button rounded gray"
                  title="Set to the available amount in this credit card's payment category"
                  onClick={() => {
                    if (ccpCategory.balance < 0) return;
                    setAmount(
                      millisToStringValue(
                        ccpCategory.balance,
                        selectedBudgetData?.currencyFormat
                      )
                    );
                  }}>
                  <CurrencyView
                    colorsEnabled
                    milliUnits={ccpCategory.balance}
                    currencyFormat={selectedBudgetData?.currencyFormat}
                  />
                </button>
              </div>
            )} */}
            <AccountSelect
              ref={accountRef}
              currentAccount={account}
              accounts={accountsData}
              selectAccount={(selectedAccount) => {
                setAccount(selectedAccount);
                if (selectedAccount) {
                  if (
                    !category &&
                    selectedAccount.on_budget &&
                    payee &&
                    "transferId" in payee &&
                    accountsData?.find((a) => a.id === payee.transferId)?.on_budget ===
                      false
                  )
                    setTimeout(() => categoryRef.current?.focus(), 50);
                  else memoRef.current?.focus();
                }
              }}
              label={amountType === "Outflow" ? "Account (From)" : "Account (To)"}
              disabled={isSaving}
            />
            {isBudgetToTrackingTransfer && (
              <CategorySelect
                ref={categoryRef}
                initialCategory={category}
                categories={categoriesData}
                selectCategory={(selectedCategory) => {
                  setCategory(selectedCategory);
                  if (selectedCategory) memoRef.current?.focus();
                }}
                disabled={isSaving}
              />
            )}
          </>
        )}
        <label className="form-input" htmlFor="memo-input">
          Memo
          <div className="flex-row">
            <input
              ref={memoRef}
              id="memo-input"
              aria-label="Memo"
              className="flex-grow"
              autoComplete="off"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={isSaving}
            />
            {settings?.currentTabAccess && (
              <IconButton
                icon={<WorldWww strokeWidth={1} />}
                label="Copy URL into memo field"
                onClick={onCopyURLIntoMemo}
              />
            )}
          </div>
        </label>

        <label className="form-input">
          Date
          <input
            required
            type="date"
            value={date}
            max={getTodaysDateISO()}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSaving}
          />
        </label>
        <div className="flex-row justify-between">
          <label className="flex-row">
            Status:
            {cleared ? (
              <IconButton
                label="Cleared (click to switch)"
                icon={<CircleC fill="var(--currency-green)" color="white" size={26} />}
                onClick={() => setCleared(false)}
              />
            ) : (
              <IconButton
                label="Uncleared (click to switch)"
                icon={<CircleC color="gray" />}
                onClick={() => setCleared(true)}
              />
            )}
          </label>
          <label className="flex-row">
            Flag:
            <select
              className="select rounded"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}>
              <option value="">None</option>
              {Object.entries(TransactionFlagColor).map(([flagName, flagValue]) => (
                <option key={flagValue} value={flagValue}>
                  {`${flagColorToEmoji(flagValue) || ""} ${flagName}`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="error-message">{errorMessage}</div>
        <div className="flex-row flex-row-reverse">
          <button
            type="submit"
            className="button rounded accent mt-lg flex-1"
            disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="button gray rounded mt-lg flex-1"
            onClick={() => setPopupState({ view: "main" })}
            disabled={isSaving}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
