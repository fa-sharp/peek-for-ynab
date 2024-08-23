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
  const { budgetSettings, selectedBudgetId } = useStorageContext();
  const { accountsData, budgetsData, categoriesData, importedTxs } = useYNABContext();

  const [currentAlerts, setCurrentAlerts] = useStorage<CurrentAlerts | undefined>(
    { key: "currentAlerts", instance: chromeLocalStorage },
    (val, isHydrated) => (!isHydrated ? undefined : !val ? {} : val)
  );
  const currentAlertsHydrated = currentAlerts !== undefined;

  // TODO set the default value to LATEST_VERSION_ALERT_NUM
  const [latestVersionAlert, setLatestVersionAlert] = useStorage<number | undefined>(
    { key: "versionAlert", instance: chromeSyncStorage },
    (val, isHydrated) => (!isHydrated ? undefined : !val ? 1 : val)
  );

  // Update currently selected budget's alerts with latest data from API
  useEffect(() => {
    if (!currentAlertsHydrated || !budgetSettings || !accountsData || !categoriesData)
      return;
    const budgetAlerts = getBudgetAlerts(budgetSettings.notifications, {
      accounts: accountsData,
      categories: categoriesData,
      importedTxs
    });
    setCurrentAlerts((prev) => ({
      ...prev,
      [selectedBudgetId]: budgetAlerts || undefined
    }));
  }, [
    accountsData,
    budgetSettings,
    categoriesData,
    currentAlertsHydrated,
    importedTxs,
    selectedBudgetId,
    setCurrentAlerts
  ]);

  // Update tooltip with latest notifications
  useEffect(() => {
    if (!currentAlertsHydrated || !budgetsData) return;
    updateIconAndTooltip(currentAlerts, budgetsData);
  }, [budgetsData, currentAlerts, currentAlertsHydrated]);

  return {
    /** The up-to-date alerts for the currently selected budget */
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
