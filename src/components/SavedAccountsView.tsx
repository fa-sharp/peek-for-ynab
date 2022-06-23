import { PinnedOff } from "tabler-icons-react";

import { IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

import { AccountView } from "./AccountsView";

/** View of user's saved accounts with balances */
export default function SavedAccountsView() {
  const { savedAccountsData } = useYNABContext();
  const { selectedBudgetData, removeAccount } = useStorageContext();

  if (!savedAccountsData || savedAccountsData.length === 0) return null;

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
          button={
            <IconButton
              label="Remove"
              onClick={() => removeAccount(account.id)}
              icon={<PinnedOff size={20} color="gray" strokeWidth={1} />}
            />
          }
        />
      ))}
    </section>
  );
}
