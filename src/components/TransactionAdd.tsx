import { FormEventHandler, MouseEventHandler, useState } from "react";
import { ArrowBack, Minus, Plus } from "tabler-icons-react";
import { SaveTransaction } from "ynab";

import { useYNABContext } from "~lib/context";
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

  const [amount, setAmount] = useState("");
  const [amountType, setAmountType] = useState<"inflow" | "outflow">("outflow");
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

  const flipAmountType: MouseEventHandler = (event) => {
    event.preventDefault();
    setAmountType((prev) => (prev === "inflow" ? "outflow" : "inflow"));
  };

  const onSaveTransaction: FormEventHandler = async (event) => {
    event.preventDefault();
    if (!account || !payee || !amount) return;
    setIsSaving(true);
    await addTransaction({
      date: new Date().toISOString(),
      amount: amountType === "inflow" ? +amount * 1000 : +amount * -1000,
      payee_id: "id" in payee ? payee.id : undefined,
      payee_name: "id" in payee ? undefined : payee.name,
      account_id: account.id,
      category_id: category?.id,
      cleared: SaveTransaction.ClearedEnum.Uncleared,
      memo
    });
    closeForm();
    setIsSaving(false);
  };

  return (
    <section>
      <div className="heading-big">
        <div role="heading">Add Transaction</div>
        <IconButton icon={<ArrowBack />} label="Back to main view" onClick={closeForm} />
      </div>
      <form className="flex-col" onSubmit={onSaveTransaction}>
        <div className="form-input">
          Amount
          <div className="flex-row">
            <IconButton
              label={amountType}
              icon={
                amountType === "inflow" ? (
                  <Plus color="var(--currency-green)" />
                ) : (
                  <Minus color="var(--currency-red)" />
                )
              }
              onClick={flipAmountType}
            />
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
        <PayeeSelect payees={payeesData} selectPayee={setPayee} disabled={isSaving} />
        <CategorySelect
          initialCategory={category}
          categories={categoriesData}
          selectCategory={setCategory}
          disabled={isSaving}
        />
        <AccountSelect
          initialAccount={account}
          accounts={accountsData}
          selectAccount={setAccount}
          disabled={isSaving}
        />
        <label className="form-input">
          Memo
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
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
