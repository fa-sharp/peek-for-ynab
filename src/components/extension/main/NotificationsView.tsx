import { useMemo, useState } from "react";
import { AlertCircle } from "tabler-icons-react";

import CurrencyView from "~components/CurrencyView";
import IconButton from "~components/IconButton";
import { CollapseListIcon, ExpandListIcon } from "~components/icons/ActionIcons";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

const NotificationsView = () => {
  const { selectedBudgetId } = useStorageContext();
  const { currentAlerts } = useNotificationsContext();
  const { selectedBudgetData, categoriesData, accountsData } = useYNABContext();

  const [expanded, setExpanded] = useState(false);

  const numNotifications = useMemo(
    () =>
      (currentAlerts?.[selectedBudgetId]?.numImportedTxs || 0) +
      Object.keys(currentAlerts?.[selectedBudgetId]?.accounts || {}).length +
      Object.keys(currentAlerts?.[selectedBudgetId]?.cats || {}).length,
    [currentAlerts, selectedBudgetId]
  );

  const overspentCategories = useMemo(
    () =>
      Object.keys(currentAlerts?.[selectedBudgetId]?.cats || {})
        .map((categoryId) => categoriesData?.find((c) => c.id === categoryId))
        .filter((c) => !!c),
    [categoriesData, currentAlerts, selectedBudgetId]
  );

  const accountsToReconcile = useMemo(
    () =>
      Object.entries(currentAlerts?.[selectedBudgetId]?.accounts || {})
        .filter(([, accountAlerts]) => !!accountAlerts?.reconcile)
        .map(([accountId]) => accountsData?.find((a) => a.id === accountId))
        .filter((a) => !!a),
    [accountsData, currentAlerts, selectedBudgetId]
  );

  const accountsWithImportError = useMemo(
    () =>
      Object.entries(currentAlerts?.[selectedBudgetId]?.accounts || {})
        .filter(([, accountAlerts]) => !!accountAlerts?.importError)
        .map(([accountId]) => accountsData?.find((a) => a.id === accountId))
        .filter((a) => !!a),
    [accountsData, currentAlerts, selectedBudgetId]
  );

  if (!currentAlerts || numNotifications === 0) return null;

  return (
    <div className="mb-sm">
      <div
        className="flex-row gap-sm justify-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <AlertCircle color="var(--stale)" size={16} />
        {`${numNotifications} notification${numNotifications > 1 ? "s" : ""}`}
        <IconButton
          icon={expanded ? <CollapseListIcon /> : <ExpandListIcon />}
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
        />
      </div>

      {expanded && (
        <ul className="list flex-col gap-xs">
          {overspentCategories.length > 0 &&
            overspentCategories.map((category) => (
              <li key={`overspent-${category.id}`} className="flex-row justify-center">
                {category.name}:{" "}
                <CurrencyView
                  milliUnits={category.balance}
                  currencyFormat={selectedBudgetData?.currencyFormat}
                  colorsEnabled
                />
              </li>
            ))}

          {accountsToReconcile.length > 0 &&
            accountsToReconcile.map(
              (account) =>
                account.last_reconciled_at && (
                  <li key={`reconcile-${account.id}`} className="flex-row justify-center">
                    {account.name}: Reconciled{` `}
                    {new Date(account.last_reconciled_at).toLocaleDateString()}
                  </li>
                )
            )}

          {accountsWithImportError.length > 0 &&
            accountsWithImportError.map(
              (account) =>
                account.last_reconciled_at && (
                  <li key={`import-${account.id}`} className="flex-row justify-center">
                    {account.name}: Import issue/error
                  </li>
                )
            )}
        </ul>
      )}
    </div>
  );
};
export default NotificationsView;
