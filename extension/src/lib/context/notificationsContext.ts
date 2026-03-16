import { createContext, useContext, useEffect } from "react";

import { LATEST_VERSION_ALERT_NUM } from "~lib/constants";
import { getBudgetAlerts, updateIconAndTooltip } from "~lib/notifications";
import { useCurrentAlerts, useVersionAlert } from "~lib/state";
import { useStorageContext } from "./storageContext";
import { useYNABContext } from "./ynabContext";

export const useNotificationsProvider = () => {
  const { budgetSettings, popupState } = useStorageContext();
  const { accountsData, budgetsData, categoriesData, unapprovedTxs } = useYNABContext();

  const [currentAlerts, setCurrentAlerts] = useCurrentAlerts();
  const [latestVersionAlert, setLatestVersionAlert] = useVersionAlert();
  const currentAlertsHydrated = currentAlerts !== undefined;

  // Update currently selected budget's alerts with latest data from API
  useEffect(() => {
    if (
      !currentAlertsHydrated ||
      !popupState.budgetId ||
      !budgetSettings ||
      !accountsData ||
      !categoriesData ||
      (!unapprovedTxs && budgetSettings.notifications.checkImports)
    )
      return;
    const budgetAlerts = getBudgetAlerts(budgetSettings.notifications, {
      accounts: accountsData,
      categories: categoriesData,
      unapprovedTxs,
    });
    setCurrentAlerts((prev) => ({
      ...prev,
      [popupState.budgetId]: budgetAlerts || undefined,
    }));
  }, [
    accountsData,
    budgetSettings,
    categoriesData,
    currentAlertsHydrated,
    unapprovedTxs,
    popupState.budgetId,
    setCurrentAlerts,
  ]);

  // Update tooltip with latest notifications
  useEffect(() => {
    if (!currentAlertsHydrated || !budgetsData) return;
    updateIconAndTooltip(currentAlerts, budgetsData);
  }, [budgetsData, currentAlerts, currentAlertsHydrated]);

  return {
    /** The up-to-date alerts for all budgets */
    currentAlerts,
    /** Whether there's an alert for a new version/update */
    newVersionAlert:
      !!latestVersionAlert && latestVersionAlert !== LATEST_VERSION_ALERT_NUM,
    resetVersionAlert: () => setLatestVersionAlert(LATEST_VERSION_ALERT_NUM),
  };
};

export const NotificationsContext =
  //@ts-expect-error Context should not be null if wrapped in provider
  createContext<ReturnType<typeof useNotificationsProvider>>(null);

/** Hook for alerts and notifications */
export const useNotificationsContext = () => useContext(NotificationsContext);
