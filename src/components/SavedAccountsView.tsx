import { Fragment } from "react";
import { List, Pinned, Plus } from "tabler-icons-react";

import { IconButton } from "~components";
import { AccountView } from "~components/AccountsView";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { AddTransactionInitialState } from "~lib/usePopupState";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
  listTx: (accountId: string) => void;
}

/** View of user's saved accounts with balances */
export default function SavedAccountsView({ addTx, listTx }: Props) {
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
                  icon={<List size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label={`List transactions in '${account.name}'`}
                  onClick={() => listTx(account.id)}
                />
                {settings.txEnabled && (
                  <IconButton
                    rounded
                    accent
                    icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                    label="Add transaction"
                    onClick={() => addTx({ accountId: account.id })}
                  />
                )}
              </aside>
            }
          />
          {idx !== savedAccountsData.length - 1 && <div className="sep-line-h"></div>}
        </Fragment>
      ))}
    </section>
  );
}
