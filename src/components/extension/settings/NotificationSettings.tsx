import { useState } from "react";

import { IconButton } from "~components";
import { CollapseListIcon, ExpandListIcon } from "~components/icons/ActionIcons";
import { useStorageContext } from "~lib/context";
import type { BudgetSettings } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";

import ReconcileAlertSettings from "./ReconcileAlertSettings";

export default function NotificationSettings({ budget }: { budget: CachedBudget }) {
  const { useBudgetSettings } = useStorageContext();
  const [settings, setSettings] = useBudgetSettings(budget.id);
  const [reconcileExpanded, setReconcileExpanded] = useState(false);

  const changeNotifSetting = <K extends keyof BudgetSettings["notifications"]>(
    key: K,
    value: BudgetSettings["notifications"][K]
  ) =>
    setSettings((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        notifications: { ...prev.notifications, [key]: value }
      };
    });

  return (
    <>
      <h4 className="heading-small">Notifications</h4>
      <div className="flex-col gap-sm">
        <label
          className="flex-row gap-xs"
          title="Notify for overspent categories this month">
          <input
            type="checkbox"
            checked={settings?.notifications.overspent ?? false}
            onChange={(e) => changeNotifSetting("overspent", e.target.checked)}
          />
          Overspending
        </label>
        <label
          className="flex-row gap-xs"
          title="Check and notify for new imports from your linked accounts">
          <input
            type="checkbox"
            checked={settings?.notifications.checkImports ?? false}
            onChange={(e) => changeNotifSetting("checkImports", e.target.checked)}
          />
          New imports
        </label>
        <label
          className="flex-row gap-xs"
          title="Notify if one of your linked accounts has a connection error/issue">
          <input
            type="checkbox"
            checked={settings?.notifications.importError ?? false}
            onChange={(e) => changeNotifSetting("importError", e.target.checked)}
          />
          Import errors
        </label>
        <div className="flex-row gap-xs">
          Reconciliation alerts
          <IconButton
            label={reconcileExpanded ? "Collapse" : "Expand"}
            icon={reconcileExpanded ? <CollapseListIcon /> : <ExpandListIcon />}
            onClick={() => setReconcileExpanded(!reconcileExpanded)}
          />
        </div>
        {reconcileExpanded && <ReconcileAlertSettings budget={budget} />}
      </div>
    </>
  );
}
