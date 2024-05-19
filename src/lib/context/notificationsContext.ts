import { createProvider } from "puro";
import { useContext, useEffect } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import {
  type CurrentAlerts,
  getBudgetAlerts,
  updateIconTooltipWithAlerts
} from "~lib/notifications";

import { useStorageContext } from "./storageContext";
import { useYNABContext } from "./ynabContext";

const chromeLocalStorage = new Storage({ area: "local" });

const useNotificationsProvider = () => {
  const { budgetSettings, selectedBudgetId } = useStorageContext();
  const { accountsData, budgetsData, categoriesData, importedTxs } = useYNABContext();

  const [currentAlerts, setCurrentAlerts] = useStorage<CurrentAlerts | undefined>(
    { key: "currentAlerts", instance: chromeLocalStorage },
    (val, isHydrated) => (!isHydrated ? undefined : !val ? {} : val)
  );
  const currentAlertsHydrated = currentAlerts !== undefined;

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
    updateIconTooltipWithAlerts(currentAlerts, budgetsData);
  }, [budgetsData, currentAlerts, currentAlertsHydrated]);

  return {
    currentAlerts
  };
};

const { BaseContext, Provider } = createProvider(useNotificationsProvider);

/** Hook for storing and retrieving data from browser storage */
export const useNotificationsContext = () => useContext(BaseContext);
export const NotificationsProvider = Provider;
