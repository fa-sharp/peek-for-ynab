import { Fragment } from "react";
import { Pinned, Plus } from "tabler-icons-react";

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

  if (!savedAccountsData || !selectedBudgetData || savedAccountsData.length === 0)
    return null;

  return (
    <section aria-label="Saved accounts" className="mt-md">
      {savedAccountsData.map((account, idx) => (
        <Fragment key={account.id}>
          <AccountView
            account={account}
            currencyFormat={selectedBudgetData?.currencyFormat}
            settings={settings}
            actionElementsLeft={
              <IconButton
                label="Unpin"
                onClick={() =>
                  removeAccount({
                    accountId: account.id,
                    budgetId: selectedBudgetData.id
                  })
                }
                icon={
                  <Pinned
                    size={"1.3rem"}
                    fill="var(--action)"
                    color="var(--action)"
                    strokeWidth={1}
                  />
                }
              />
            }
            actionElementsRight={
              <aside className="balance-actions" aria-label="actions">
                <IconButton
                  rounded
                  accent
                  icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label="Add transaction"
                  onClick={() => addTx({ accountId: account.id })}
                />
              </aside>
            }
          />
          {idx !== savedAccountsData.length - 1 && <div className="sep-line-h"></div>}
        </Fragment>
      ))}
    </section>
  );
}
