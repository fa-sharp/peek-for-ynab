import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { CircleC, InfoCircle, Settings } from "tabler-icons-react";

import { AccountSelect, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { BudgetSettings } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";

export default function BudgetSettings({ budget }: { budget: CachedBudget }) {
  const { shownBudgetIds, toggleShowBudget } = useStorageContext();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!shownBudgetIds?.includes(budget.id)) setShowSettings(false);
  }, [budget.id, shownBudgetIds]);

  return (
    <li>
      <div className="flex-row">
        <label
          className={clsx("flex-row", {
            "heading-medium": shownBudgetIds?.includes(budget.id)
          })}>
          <input
            type="checkbox"
            checked={shownBudgetIds?.includes(budget.id)}
            onChange={() => toggleShowBudget(budget.id)}
          />
          {budget.name}
        </label>
        {shownBudgetIds?.includes(budget.id) && (
          <IconButton
            icon={<Settings size={18} />}
            label={!showSettings ? "Show budget settings" : "Hide budget settings"}
            onClick={() => setShowSettings((prev) => !prev)}
          />
        )}
      </div>
      {showSettings && <BudgetSettingsDetail budget={budget} />}
    </li>
  );
}

function BudgetSettingsDetail({ budget }: { budget: CachedBudget }) {
  const { useBudgetSettings } = useStorageContext();
  const { useGetAccountsForBudget } = useYNABContext();

  const [settings, setSettings] = useBudgetSettings(budget.id);
  const { data: accounts, error: accountsError } = useGetAccountsForBudget(budget.id);

  const changeTxSetting = <K extends keyof BudgetSettings["transactions"]>(
    key: K,
    value: BudgetSettings["transactions"][K]
  ) =>
    setSettings((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        transactions: { ...prev.transactions, [key]: value }
      };
    });

  return (
    <div
      style={{
        marginLeft: "2rem",
        marginBottom: "1rem",
        maxWidth: "15rem"
      }}>
      <h4 className="heading-small mb-lg">Transactions</h4>
      <div className="flex-col">
        <label
          className="flex-row gap-xs"
          title="Set transactions as Approved by default">
          <input
            type="checkbox"
            checked={settings?.transactions.approved ?? false}
            onChange={(e) => changeTxSetting("approved", e.target.checked)}
          />
          <InfoCircle fill="#2ea1be" stroke="white" size={16} /> Approved
        </label>
        <label className="flex-row gap-xs" title="Set transactions as Cleared by default">
          <input
            type="checkbox"
            checked={settings?.transactions.cleared ?? false}
            onChange={(e) => changeTxSetting("cleared", e.target.checked)}
          />
          <CircleC stroke="white" fill="var(--currency-green)" size={16} />
          Cleared
        </label>
        <label
          className="flex-row gap-xs"
          title="Remember the last-used account when entering transactions">
          <input
            type="checkbox"
            checked={settings?.transactions.rememberAccount ?? false}
            onChange={(e) => changeTxSetting("rememberAccount", e.target.checked)}
          />
          Remember last-used account
        </label>
        {!settings?.transactions.rememberAccount &&
          (accountsError ? (
            <div className="error-message">Error getting accounts!</div>
          ) : accounts ? (
            <AccountSelect
              label="Default account"
              required={false}
              placeholder="Select a default account (optional)"
              accounts={accounts}
              currentAccount={
                accounts?.find((a) => a.id === settings?.transactions.defaultAccountId) ||
                null
              }
              selectAccount={(account) => {
                changeTxSetting("defaultAccountId", account ? account.id : undefined);
              }}
            />
          ) : null)}
      </div>
    </div>
  );
}
