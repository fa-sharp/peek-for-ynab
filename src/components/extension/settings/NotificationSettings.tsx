import { useState } from "react";
import { Help } from "tabler-icons-react";

import { Dialog, IconButton, Tooltip } from "~components";
import { CollapseListIcon, ExpandListIcon } from "~components/icons/ActionIcons";
import { useStorageContext } from "~lib/context";
import type { BudgetSettings, CachedBudget } from "~lib/types";

import ReconcileAlertSettings from "./ReconcileAlertSettings";

export default function NotificationSettings({ budget }: { budget: CachedBudget }) {
  const { useBudgetSettings } = useStorageContext();
  const [budgetSettings, setBudgetSettings] = useBudgetSettings(budget.id);
  const [reconcileExpanded, setReconcileExpanded] = useState(false);

  const changeNotifSetting = <K extends keyof BudgetSettings["notifications"]>(
    key: K,
    value: BudgetSettings["notifications"][K]
  ) =>
    setBudgetSettings((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        notifications: { ...prev.notifications, [key]: value }
      };
    });

  return (
    <>
      <h4 aria-labelledby="notification-heading" className="heading-medium mb-sm">
        <span id="notification-heading">Notifications</span>
        <Tooltip label="More info" icon={<Help size={18} aria-hidden />} placement="top">
          <Dialog>Enable notifications for the following events in your budget.</Dialog>
        </Tooltip>
      </h4>
      <div className="flex-col gap-sm mb-lg">
        <label
          className="flex-row gap-xs"
          title="Notify for overspent categories this month">
          <input
            type="checkbox"
            checked={budgetSettings?.notifications.overspent ?? false}
            onChange={(e) => changeNotifSetting("overspent", e.target.checked)}
          />
          Overspending
        </label>
        <label
          className="flex-row gap-xs"
          title="Check and notify for newly imported and/or unapproved transactions from your accounts">
          <input
            type="checkbox"
            checked={budgetSettings?.notifications.checkImports ?? false}
            onChange={(e) => changeNotifSetting("checkImports", e.target.checked)}
          />
          Unapproved transactions
        </label>
        <label
          className="flex-row gap-xs"
          title="Notify if one of your linked accounts has a connection error/issue">
          <input
            type="checkbox"
            checked={budgetSettings?.notifications.importError ?? false}
            onChange={(e) => changeNotifSetting("importError", e.target.checked)}
          />
          Import errors
        </label>
      </div>
      <h4
        aria-labelledby="reconcile-heading"
        className="heading-medium flex-row gap-xs cursor-pointer"
        onClick={() => setReconcileExpanded(!reconcileExpanded)}>
        <span id="reconcile-heading">Reconciliation alerts</span>
        <Tooltip label="More info" icon={<Help size={18} aria-hidden />} placement="top">
          <Dialog>
            Setup alerts to notify you if an account has not been reconciled in the given
            amount of time.
          </Dialog>
        </Tooltip>
        <IconButton
          label={reconcileExpanded ? "Collapse" : "Expand"}
          icon={reconcileExpanded ? <CollapseListIcon /> : <ExpandListIcon />}
          onClick={() => setReconcileExpanded(!reconcileExpanded)}
        />
      </h4>
      {reconcileExpanded && <ReconcileAlertSettings budget={budget} />}
    </>
  );
}
