import { FormEventHandler, useState } from "react";
import { ArrowBack } from "tabler-icons-react";

import { useYNABContext } from "~lib/context";
import type { CachedPayee } from "~lib/context/ynabContext";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";

import { CategorySelect, IconButton, PayeeSelect } from ".";

interface Props {
  initialState?: AddTransactionInitialState;
  closeForm: () => void;
}

/** Form that lets user add a transaction. */
export default function TransactionAdd({ initialState, closeForm }: Props) {
  const { accountsData, categoriesData, payeesData } = useYNABContext();

  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState<CachedPayee | { name: string } | null>(null);
  const [category, setCategory] = useState(() => {
    if (!initialState?.categoryId) return null;
    return categoriesData?.find((c) => c.id === initialState.categoryId);
  });
  const [account, setAccount] = useState(() => {
    if (!initialState?.accountId) return null;
    return accountsData?.find((a) => a.id === initialState.accountId);
  });

  const [isSaving, setIsSaving] = useState(false);

  const onSaveTransaction: FormEventHandler = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      console.log("New transaction: ", { payee, category, account, amount });
      setIsSaving(false);
    }, 2000);
  };

  return (
    <section aria-label="Add transaction form">
      <h2 className="heading-big" style={{ marginBottom: "1rem" }}>
        Add Transaction
        <IconButton icon={<ArrowBack />} label="Back to main view" onClick={closeForm} />
      </h2>
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
          />
        </label>
        <PayeeSelect payees={payeesData} selectPayee={setPayee} />
        <CategorySelect categories={categoriesData} selectCategory={setCategory} />
        <label className="form-input">
          Account
          <input defaultValue={account?.name} />
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
