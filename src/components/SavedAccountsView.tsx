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
    <section aria-label="Saved accounts" className="flex-col mt-md">
      {savedAccountsData.map((account) => (
        <AccountView
          key={account.id}
          account={account}
          currencyFormat={selectedBudgetData?.currencyFormat}
          settings={settings}
          actionElementsLeft={
            <IconButton
              label={`Unpin '${account.name}'`}
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
                bordered
                icon={<List size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                label={`List transactions in '${account.name}'`}
                onClick={() => listTx(account.id)}
              />
              {settings.txEnabled && (
                <IconButton
                  rounded
                  accent
                  icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label={`Add transaction to '${account.name}'`}
                  onClick={() => addTx({ accountId: account.id })}
                />
              )}
            </aside>
          }
        />
      ))}
    </section>
  );
}
