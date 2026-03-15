import { useQuery } from "@tanstack/react-query";
import { use, useCallback, useMemo } from "react";

import { storage } from "#imports";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "~lib/constants";
import type { AppSettings } from "~lib/types";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

export function appSettingsStorage(area: "local" | "sync") {
  return storage.defineItem<AppSettings>(`${area}:${STORAGE_KEYS.AppSettings}`, {
    fallback: DEFAULT_SETTINGS,
    version: 3,
    migrations: {
      2: safeMigrateJsonString(DEFAULT_SETTINGS),
      3: async (oldSettings: Omit<AppSettings, "budgets">) => {
        const oldBudgetsString = await storage.getItem<string>(`${area}:budgets`);
        const budgets = safeMigrateJsonString<string[]>([])(oldBudgetsString);
        return { ...oldSettings, budgets } satisfies AppSettings;
      },
    },
  });
}

export const shouldSyncStorage = storage.defineItem<boolean>(
  `local:${STORAGE_KEYS.ShouldSyncSettings}`,
  {
    fallback: false,
    version: 2,
    migrations: {
      2: safeMigrateJsonString(false),
    },
  }
);

export const useAppSettings = () => {
  // Fetch the sync setting on render to avoid loading state
  const syncQuery = useQuery({
    queryKey: [STORAGE_KEYS.ShouldSyncSettings],
    queryFn: shouldSyncStorage.getValue,
    staleTime: Infinity,
  });
  const shouldSync = use(syncQuery.promise);

  const settingsStore = useMemo(
    () => appSettingsStorage(shouldSync ? "sync" : "local"),
    [shouldSync]
  );
  const [settings, setSettings] = useChromeStorage(settingsStore);

  const changeSetting = useCallback(
    async <K extends keyof AppSettings | "sync">(
      key: K,
      newValue: K extends keyof AppSettings ? AppSettings[K] : boolean
    ) => {
      if (key === "sync") {
        await shouldSyncStorage.setValue(newValue as boolean);
        await syncQuery.refetch();
        return;
      } else {
        return setSettings((prev) => (prev ? { ...prev, [key]: newValue } : prev));
      }
    },
    [syncQuery, setSettings]
  );

  const toggleShowBudget = useCallback(
    async (budgetId: string) => {
      if (!settings) return;

      if (!settings.budgets) {
        return changeSetting("budgets", [budgetId]);
      } else if (!settings.budgets.includes(budgetId)) {
        return changeSetting("budgets", [...settings.budgets, budgetId]);
      } else {
        return changeSetting(
          "budgets",
          settings.budgets.filter((id) => id !== budgetId)
        );
      }
    },
    [settings, changeSetting]
  );

  return {
    /** Whether user's settings are synced */
    sync: shouldSync,
    /** The user's global settings */
    settings,
    /** Change a specific global setting */
    changeSetting,
    /** Toggle whether a budget is shown or not. */
    toggleShowBudget,
  };
};
