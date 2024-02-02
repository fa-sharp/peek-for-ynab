import { useStorageContext, useYNABContext } from "~lib/context";
import type { CachedBudget } from "~lib/context/ynabContext";

import AccountSelect from "./AccountSelect";

export default function BudgetSettings({ budget }: { budget: CachedBudget }) {
  const { shownBudgetIds, toggleShowBudget } = useStorageContext();

  return (
    <>
      <label
        className={shownBudgetIds?.includes(budget.id) ? "heading-medium" : "flex-row"}>
        <input
          type="checkbox"
          checked={shownBudgetIds?.includes(budget.id)}
          onChange={() => toggleShowBudget(budget.id)}
        />
        {budget.name}
      </label>
      {shownBudgetIds?.includes(budget.id) && <BudgetSettingsDetail budget={budget} />}
    </>
  );
}

function BudgetSettingsDetail({ budget }: { budget: CachedBudget }) {
  const { useBudgetSettings } = useStorageContext();
  const { useGetAccountsForBudget } = useYNABContext();

  const [settings, setSettings] = useBudgetSettings(budget.id);
  const { data: accounts } = useGetAccountsForBudget(budget.id);

  return (
    <div
      style={{
        marginLeft: "2rem",
        marginBottom: "1rem",
        maxWidth: "15rem",
        fontSize: ".95em"
      }}>
      <h4 className="heading-small mb-small">Transactions</h4>
      <div className="flex-col">
        <label
          className="flex-row gap-xs"
          title="Remember the last-used account when entering transactions">
          <input
            type="checkbox"
            checked={settings?.rememberAccount ?? false}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, rememberAccount: e.target.checked }))
            }
          />
          Remember last-used account
        </label>
        {!settings?.rememberAccount && accounts && (
          <AccountSelect
            label="Default account?"
            accounts={accounts}
            currentAccount={
              accounts?.find((a) => a.id === settings?.defaultAccountId) || null
            }
            selectAccount={(account) => {
              if (account)
                setSettings((prev) => ({ ...prev, defaultAccountId: account.id }));
              else setSettings((prev) => ({ ...prev, defaultAccountId: undefined }));
            }}
          />
        )}
      </div>
    </div>
  );
}
