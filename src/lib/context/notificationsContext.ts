import { createProvider } from "puro";
import { useContext, useEffect } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { LATEST_VERSION_ALERT_NUM } from "~lib/constants";
import {
  type CurrentAlerts,
  getBudgetAlerts,
  updateIconAndTooltip
} from "~lib/notifications";

import { useStorageContext } from "./storageContext";
import { useYNABContext } from "./ynabContext";

const chromeLocalStorage = new Storage({ area: "local" });
const chromeSyncStorage = new Storage({ area: "sync" });

const useNotificationsProvider = () => {
  const { budgetSettings, popupState } = useStorageContext();
  const { accountsData, budgetsData, categoriesData, unapprovedTxs } = useYNABContext();

  const [currentAlerts, setCurrentAlerts] = useStorage<CurrentAlerts | undefined>(
    { key: "currentAlerts", instance: chromeLocalStorage },
    (val, isHydrated) => (!isHydrated ? undefined : !val ? {} : val)
  );
  const currentAlertsHydrated = currentAlerts !== undefined;

  const [latestVersionAlert, setLatestVersionAlert] = useStorage<number | undefined>(
    { key: "versionAlert", instance: chromeSyncStorage },
    (val, isHydrated) => (!isHydrated ? undefined : !val ? LATEST_VERSION_ALERT_NUM : val)
  );

  // Update currently selected budget's alerts with latest data from API
  useEffect(() => {
    if (
      !currentAlertsHydrated ||
      !budgetSettings ||
      !accountsData ||
      !categoriesData ||
      !popupState?.budgetId
    )
      return;
    const budgetAlerts = getBudgetAlerts(budgetSettings.notifications, {
      accounts: accountsData,
      categories: categoriesData,
      unapprovedTxs
    });
    setCurrentAlerts((prev) => ({
      ...prev,
      [popupState.budgetId]: budgetAlerts || undefined
    }));
  }, [
    accountsData,
    budgetSettings,
    categoriesData,
    currentAlertsHydrated,
    unapprovedTxs,
    popupState?.budgetId,
    setCurrentAlerts
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
    resetVersionAlert: () => setLatestVersionAlert(LATEST_VERSION_ALERT_NUM)
  };
};

const { BaseContext, Provider } = createProvider(useNotificationsProvider);

/** Hook for retrieving current alerts and notifications */
export const useNotificationsContext = () => useContext(BaseContext);
export const NotificationsProvider = Provider;
