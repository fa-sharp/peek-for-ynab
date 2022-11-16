import { FormEventHandler, useState } from "react";
import { ArrowBack } from "tabler-icons-react";
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
  const [payee, setPayee] = useState<CachedPayee | { name: string } | null>(null);
  const [category, setCategory] = useState(() => {
    if (!initialState?.categoryId) return;
    return categoriesData?.find((c) => c.id === initialState.categoryId);
  });
  const [account, setAccount] = useState(() => {
    if (!initialState?.accountId) return;
    return accountsData?.find((a) => a.id === initialState.accountId);
  });

  const [isSaving, setIsSaving] = useState(false);

  const onSaveTransaction: FormEventHandler = async (event) => {
    event.preventDefault();
    if (!account || !payee || !amount) return;
    setIsSaving(true);
    await addTransaction({
      date: new Date().toISOString(),
      amount: +amount * 1000,
      payee_id: "id" in payee ? payee.id : undefined,
      payee_name: "id" in payee ? undefined : payee.name,
      account_id: account.id,
      category_id: category?.id,
      cleared: SaveTransaction.ClearedEnum.Uncleared
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
        <label className="form-input">
          Amount
          <input
            required
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSaving}
          />
        </label>
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
        <button
          className="button rounded accent mt-xxl"
          type="submit"
          disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </form>
    </section>
  );
}
