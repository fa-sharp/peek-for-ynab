import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { AlertCircle } from "tabler-icons-react";

import CurrencyView from "~components/CurrencyView";
import IconButton from "~components/IconButton";
import { CollapseListIcon, ExpandListIcon } from "~components/icons/ActionIcons";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { getNumAlertsForBudget } from "~lib/notifications";
import { formatDateMonthAndDay } from "~lib/utils";

const NotificationsView = () => {
  const { popupState } = useStorageContext();
  const { currentAlerts } = useNotificationsContext();
  const { selectedBudgetData, categoriesData, accountsData } = useYNABContext();

  const [expanded, setExpanded] = useState(false);

  const numNotifications = useMemo(
    () =>
      popupState?.budgetId && currentAlerts?.[popupState.budgetId]
        ? getNumAlertsForBudget(currentAlerts[popupState.budgetId]!)
        : 0,
    [currentAlerts, popupState?.budgetId]
  );

  const numUnapprovedTxs = useMemo(
    () =>
      popupState?.budgetId
        ? (currentAlerts?.[popupState.budgetId]?.numUnapprovedTxs ?? 0)
        : 0,
    [currentAlerts, popupState?.budgetId]
  );

  const overspentCategories = useMemo(
    () =>
      popupState?.budgetId
        ? Object.keys(currentAlerts?.[popupState.budgetId]?.cats || {})
            .map((categoryId) => categoriesData?.find((c) => c.id === categoryId))
            .filter((c) => !!c)
        : [],
    [categoriesData, currentAlerts, popupState?.budgetId]
  );

  const accountsToReconcile = useMemo(
    () =>
      popupState?.budgetId
        ? Object.entries(currentAlerts?.[popupState.budgetId]?.accounts || {})
            .filter(([, accountAlerts]) => !!accountAlerts?.reconcile)
            .map(([accountId]) => accountsData?.find((a) => a.id === accountId))
            .filter((a) => !!a)
        : [],
    [accountsData, currentAlerts, popupState?.budgetId]
  );

  const accountsWithImportError = useMemo(
    () =>
      popupState?.budgetId
        ? Object.entries(currentAlerts?.[popupState.budgetId]?.accounts || {})
            .filter(([, accountAlerts]) => !!accountAlerts?.importError)
            .map(([accountId]) => accountsData?.find((a) => a.id === accountId))
            .filter((a) => !!a)
        : [],
    [accountsData, currentAlerts, popupState?.budgetId]
  );

  if (!currentAlerts || !popupState || numNotifications === 0) return null;

  return (
    <div className={clsx("flex-col gap-0 rounded mb-md", { "pb-sm": expanded })}>
      <div
        className="flex-row gap-sm justify-center font-bold cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <AlertCircle color="var(--stale)" size={16} aria-hidden />
        {`${numNotifications} alert${numNotifications > 1 ? "s" : ""}`}
        <IconButton
          icon={expanded ? <CollapseListIcon /> : <ExpandListIcon />}
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
        />
      </div>

      {expanded && (
        <ul className="list flex-col gap-sm">
          {numUnapprovedTxs > 0 && (
            <li className="flex-row justify-center">
              {`${numUnapprovedTxs} unapproved transaction${numUnapprovedTxs > 1 ? "s" : ""}`}
            </li>
          )}

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
                    {`${account.name}: Reconciled ${formatDateMonthAndDay(new Date(account.last_reconciled_at))}`}
                  </li>
                )
            )}

          {accountsWithImportError.length > 0 &&
            accountsWithImportError.map((account) => (
              <li key={`importError-${account.id}`} className="flex-row justify-center">
                {account.name}: Import issue
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};
export default NotificationsView;
