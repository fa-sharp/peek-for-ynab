import { FormEventHandler, MouseEventHandler, useState } from "react";
import { ArrowBack, CircleC, Minus, Plus, SwitchHorizontal } from "tabler-icons-react";
import { SaveTransaction } from "ynab";

import { useStorageContext, useYNABContext } from "~lib/context";
import type { CachedPayee } from "~lib/context/ynabContext";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";

import { AccountSelect, CategorySelect, IconButton, PayeeSelect } from ".";

interface Props {
  initialState?: AddTransactionInitialState;
  closeForm: () => void;
}

/** Form that lets user add a transaction. */
export default function TransactionAdd({ initialState, closeForm }: Props) {
  const { accountsData, categoriesData, payeesData, addTransaction } = useYNABContext();
  const { settings } = useStorageContext();

  const [isTransfer, setIsTransfer] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [amount, setAmount] = useState("");
  const [cleared, setCleared] = useState(false);
  const [amountType, setAmountType] = useState<"Inflow" | "Outflow">("Outflow");
  const [payee, setPayee] = useState<CachedPayee | { name: string } | null>(null);
  const [category, setCategory] = useState(() => {
    if (!initialState?.categoryId) return;
    return categoriesData?.find((c) => c.id === initialState.categoryId);
  });
  const [account, setAccount] = useState(() => {
    if (!initialState?.accountId) return;
    return accountsData?.find((a) => a.id === initialState.accountId);
  });
  const [memo, setMemo] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType((prev) => (prev === "Inflow" ? "Outflow" : "Inflow"));
  };

  const onSaveTransaction: FormEventHandler = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!account || !payee || !amount) {
      setErrorMessage("Missing some fields!");
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
        amount: amountType === "Outflow" || isTransfer ? +amount * -1000 : +amount * 1000,
        payee_id: "id" in payee ? payee.id : undefined,
        payee_name: "id" in payee ? undefined : payee.name,
        account_id: account.id,
        category_id: isTransfer ? undefined : category?.id,
        cleared: cleared
          ? SaveTransaction.ClearedEnum.Cleared
          : SaveTransaction.ClearedEnum.Uncleared,
        approved: settings.txApproved,
        memo
      });
      closeForm();
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
        <IconButton icon={<ArrowBack />} label="Back to main view" onClick={closeForm} />
      </div>
      <form className="flex-col" onSubmit={onSaveTransaction}>
        <label className="flex-row">
          Cleared?
          <input
            type="checkbox"
            checked={cleared}
            onChange={(e) => setCleared(e.target.checked)}
          />
          {cleared ? (
            <IconButton
              label="Cleared"
              icon={<CircleC fill="var(--currency-green)" color="white" />}
              disabled
              noAction
            />
          ) : (
            <IconButton
              label=""
              icon={<CircleC color="transparent" />}
              disabled
              noAction
            />
          )}
        </label>
        <label className="flex-row">
          Transfer?
          <input
            type="checkbox"
            checked={isTransfer}
            onChange={(e) => setIsTransfer(e.target.checked)}
          />
          {isTransfer ? (
            <IconButton
              label="Transfer"
              icon={<SwitchHorizontal color="black" />}
              disabled
              noAction
            />
          ) : (
            <IconButton
              label=""
              icon={<SwitchHorizontal color="transparent" />}
              disabled
              noAction
            />
          )}
        </label>
        <div className="form-input">
          Amount
          <div className="flex-row">
            {!isTransfer && (
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
            )}
            <input
              required
              autoFocus
              aria-label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        {!isTransfer && (
          <>
            <PayeeSelect payees={payeesData} selectPayee={setPayee} disabled={isSaving} />
            <CategorySelect
              initialCategory={category}
              categories={categoriesData}
              selectCategory={setCategory}
              disabled={isSaving}
            />
          </>
        )}
        <AccountSelect
          initialAccount={account}
          accounts={accountsData}
          selectAccount={setAccount}
          isTransfer={isTransfer}
          disabled={isSaving}
        />
        {isTransfer && (
          <PayeeSelect
            payees={payeesData}
            selectPayee={setPayee}
            disabled={isSaving}
            isTransfer
          />
        )}
        <label className="form-input">
          Memo
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={isSaving}
          />
        </label>
        <label className="form-input">
          Date
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSaving}
          />
        </label>
        <div className="error-message">{errorMessage}</div>
        <button
          className="button rounded accent mt-big"
          type="submit"
          disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </form>
    </section>
  );
}
