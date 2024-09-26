import { CircleC, Help, InfoCircle } from "tabler-icons-react";

import { AccountSelect, Dialog, Tooltip } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { BudgetSettings } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";

export default function TransactionSettings({ budget }: { budget: CachedBudget }) {
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
    <>
      <h4 aria-labelledby="tx-heading" className="heading-medium">
        <span id="tx-heading">Transaction defaults</span>
        <Tooltip label="More info" icon={<Help size={20} aria-hidden />} placement="top">
          <Dialog>Set default settings when entering a transaction.</Dialog>
        </Tooltip>
      </h4>
      <div className="flex-col gap-sm mb-lg">
        <label className="flex-row gap-xs">
          <input
            type="checkbox"
            checked={settings?.transactions.approved ?? false}
            onChange={(e) => changeTxSetting("approved", e.target.checked)}
          />
          <InfoCircle aria-hidden fill="#2ea1be" stroke="white" size={16} /> Approved
        </label>
        <label className="flex-row gap-xs">
          <input
            type="checkbox"
            checked={settings?.transactions.cleared ?? false}
            onChange={(e) => changeTxSetting("cleared", e.target.checked)}
          />
          <CircleC aria-hidden stroke="white" fill="var(--currency-green)" size={16} />
          Cleared
        </label>
        <label className="flex-row gap-xs">
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
    </>
  );
}
