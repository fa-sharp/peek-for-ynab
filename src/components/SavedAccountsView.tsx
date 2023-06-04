import { PinnedOff, Plus } from "tabler-icons-react";

import { IconButton } from "~components";
import { AccountView } from "~components/AccountsView";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
}

/** View of user's saved accounts with balances */
export default function SavedAccountsView({ addTx }: Props) {
  const { selectedBudgetData, savedAccountsData } = useYNABContext();
  const { removeAccount, settings } = useStorageContext();

  if (
    !settings.showAccounts ||
    !savedAccountsData ||
    !selectedBudgetData ||
    savedAccountsData.length === 0
  )
    return null;

  return (
    <section
      aria-label="Saved accounts"
      style={{
        marginBottom: "1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
      {savedAccountsData.map((account) => (
        <AccountView
          key={account.id}
          account={account}
          currencyFormat={selectedBudgetData?.currencyFormat}
          settings={settings}
          actionElements={
            <aside className="balance-actions" aria-label="actions">
              {settings.txEnabled && (
                <IconButton
                  icon={<Plus size={"1.3rem"} color="gray" strokeWidth={1} />}
                  label={`Add transaction to '${account.name}'`}
                  onClick={() => addTx({ accountId: account.id })}
                />
              )}
              <IconButton
                label={`Unpin '${account.name}'`}
                onClick={() =>
                  removeAccount({
                    accountId: account.id,
                    budgetId: selectedBudgetData.id
                  })
                }
                icon={<PinnedOff size={"1.3rem"} color="gray" strokeWidth={1} />}
              />
            </aside>
          }
        />
      ))}
    </section>
  );
}
