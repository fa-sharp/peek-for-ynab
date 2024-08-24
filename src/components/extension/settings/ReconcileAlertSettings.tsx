import { useStorageContext, useYNABContext } from "~lib/context";
import type { CachedBudget } from "~lib/context/ynabContext";

export default function ReconcileAlertSettings({ budget }: { budget: CachedBudget }) {
  const { useBudgetSettings } = useStorageContext();
  const { useGetAccountsForBudget } = useYNABContext();
  const { data: accountsData } = useGetAccountsForBudget(budget.id);

  const [settings, setSettings] = useBudgetSettings(budget.id);

  const editReconcileNotification = (accountId: string, days?: number) => {
    if (!settings || !accountsData) return;
    const newReconcileAlerts = {
      ...settings.notifications.reconcileAlerts,
      [accountId]: days
    };
    // clean up accounts in the `reconcileAlerts` object that have been closed/deleted
    for (const accountId in newReconcileAlerts) {
      if (!accountsData.find((a) => a.id === accountId))
        newReconcileAlerts[accountId] = undefined;
    }

    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        reconcileAlerts: newReconcileAlerts
      }
    });
  };

  if (!settings) return null;

  return (
    <ul className="list flex-col gap-sm">
      {!accountsData ? (
        <li>Loading accounts...</li>
      ) : (
        accountsData.map((account) => (
          <li key={account.id} className="flex-row">
            {account.name}:
            <select
              className="select small rounded"
              value={settings.notifications.reconcileAlerts?.[account.id] || ""}
              onChange={(e) =>
                editReconcileNotification(account.id, +e.target.value || undefined)
              }>
              <option>None</option>
              <option value={1}>1 day</option>
              <option value={2}>2 days</option>
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
              <option value={30}>1 month</option>
            </select>
          </li>
        ))
      )}
    </ul>
  );
}
