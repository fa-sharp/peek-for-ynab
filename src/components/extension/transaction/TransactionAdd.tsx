import { useRef } from "react";
import { Check, CircleC } from "tabler-icons-react";
import { TransactionFlagColor } from "ynab";

import { useStorageContext, useYNABContext } from "~lib/context";
import useTransaction from "~lib/useTransaction";
import { flagColorToEmoji, getTodaysDateISO } from "~lib/utils";

import {
  AccountSelect,
  AmountField,
  CategorySelect,
  CurrencyView,
  IconButton,
  MemoField,
  PayeeSelect,
  SubTransaction
} from "../..";

/** Form that lets user add a transaction. */
export default function TransactionAdd() {
  const { selectedBudgetData, accountsData, categoriesData, payeesData } =
    useYNABContext();
  const { settings, setPopupState } = useStorageContext();

  const categoryRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  const {
    account,
    amount,
    amountType,
    category,
    cleared,
    date,
    errorMessage,
    flag,
    memo,
    payee,
    subTxs,
    totalSubTxsAmount,
    isSaving,
    isSplit,
    isTransfer,
    isBudgetToTrackingTransfer,
    onAddSubTx,
    onRemoveSubTx,
    onSaveTransaction,
    setAccount,
    setAmount,
    setAmountType,
    setCategory,
    setCleared,
    setDate,
    setFlag,
    setIsSplit,
    setIsTransfer,
    setMemo,
    setPayee,
    setSubTxs
  } = useTransaction();

  return (
    <section style={{ minWidth: 240 }}>
      <div className="heading-big">
        <div role="heading">Add Transaction</div>
      </div>
      <form className="flex-col" onSubmit={onSaveTransaction}>
        <div className="flex-col gap-0 pb-sm border-b">
          <label className="flex-row">
            (BETA) Split transaction?
            {isSplit ? (
              <IconButton
                label="Split (click to switch)"
                icon={<Check color="var(--currency-green)" />}
                onClick={() => setIsSplit(false)}
              />
            ) : (
              <IconButton
                label="Not a split (click to switch)"
                icon={<Check color="#aaa" />}
                onClick={() => setIsSplit(true)}
              />
            )}
          </label>
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
        </div>
        {!isSplit ? (
          <AmountField
            amount={amount}
            amountType={amountType}
            disabled={isSaving}
            setAmount={setAmount}
            setAmountType={setAmountType}
          />
        ) : (
          <>
            {subTxs.map((subTx, idx) => (
              <SubTransaction
                key={idx}
                splitIndex={idx}
                amount={subTx.amount}
                amountType={subTx.amountType}
                allowTransfer={!isTransfer}
                setAmount={(newAmount) =>
                  setSubTxs((prev) =>
                    prev.with(idx, {
                      ...prev[idx],
                      amount: newAmount
                    })
                  )
                }
                setAmountType={(newAmountType) =>
                  setSubTxs((prev) =>
                    prev.with(idx, {
                      ...prev[idx],
                      amountType: newAmountType
                    })
                  )
                }
                setCategory={(newCategory) =>
                  setSubTxs((prev) =>
                    prev.with(idx, {
                      ...prev[idx],
                      category: newCategory
                    })
                  )
                }
                setPayee={(newPayee) =>
                  setSubTxs((prev) =>
                    prev.with(idx, {
                      ...prev[idx],
                      payee: newPayee
                    })
                  )
                }
                setMemo={(newMemo) =>
                  setSubTxs((prev) =>
                    prev.with(idx, {
                      ...prev[idx],
                      memo: newMemo
                    })
                  )
                }
              />
            ))}
            <div className="flex-row mt-md">
              <button
                type="button"
                className="button accent rounded flex-1"
                onClick={onAddSubTx}>
                Add split
              </button>
              {subTxs.length > 1 && (
                <button
                  type="button"
                  className="button warn rounded flex-1"
                  onClick={onRemoveSubTx}>
                  Remove split
                </button>
              )}
            </div>
            <div className="heading-medium balance-display mt-sm mb-sm">
              Total Amount:
              <CurrencyView
                milliUnits={totalSubTxsAmount}
                currencyFormat={selectedBudgetData?.currencyFormat}
                colorsEnabled
              />
            </div>
          </>
        )}
        {!isTransfer ? (
          <>
            <PayeeSelect
              payees={payeesData}
              selectPayee={(selectedPayee) => {
                setPayee(selectedPayee);
                if ("id" in selectedPayee) {
                  if (!category && categoryRef.current) categoryRef.current.focus();
                  else if (!account) accountRef.current?.focus();
                  else memoRef.current?.focus();
                }
              }}
              disabled={isSaving}
            />
            {!isSplit && (!account || account.on_budget) && (
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
            )}
            <AccountSelect
              ref={accountRef}
              currentAccount={account}
              accounts={accountsData}
              selectAccount={(selectedAccount) => {
                setAccount(selectedAccount);
                if (selectedAccount) {
                  memoRef.current?.focus();
                  if (selectedAccount.type === "cash") setCleared(true);
                }
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
              label={
                (!isSplit ? amountType === "Outflow" : totalSubTxsAmount <= 0)
                  ? "Payee (To)"
                  : "Payee (From)"
              }
              disabled={isSaving}
            />
            {!isSplit && isBudgetToTrackingTransfer && (
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
                  if (selectedAccount.type === "cash") setCleared(true);
                }
              }}
              label={
                (!isSplit ? amountType === "Outflow" : totalSubTxsAmount <= 0)
                  ? "Account (From)"
                  : "Account (To)"
              }
              disabled={isSaving}
            />
          </>
        )}
        <MemoField
          ref={memoRef}
          memo={memo}
          setMemo={setMemo}
          disabled={isSaving}
          settings={settings}
        />
        <div className="flex-row justify-between mt-sm">
          <label className="flex-row">
            Status:
            {cleared ? (
              <IconButton
                label="Cleared (click to switch)"
                icon={<CircleC fill="var(--currency-green)" color="white" />}
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
        <div className="error-message">{errorMessage}</div>
        <div className="flex-row flex-row-reverse mt-lg">
          <button
            type="submit"
            className="button rounded accent flex-1"
            disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="button gray rounded flex-1"
            onClick={() => setPopupState({ view: "main" })}
            disabled={isSaving}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
