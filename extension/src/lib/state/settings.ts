import { use, useMemo } from "react";

import { storage } from "#imports";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "~lib/constants";
import type { AppSettings } from "~lib/types";
import { shouldSyncStorage, useShouldSyncSettings } from "./sync";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

export function appSettingsStorage(area: "local" | "sync") {
  return storage.defineItem<AppSettings>(`${area}:${STORAGE_KEYS.AppSettings}`, {
    fallback: DEFAULT_SETTINGS,
    version: 2,
    migrations: {
      2: safeMigrateJsonString(DEFAULT_SETTINGS),
    },
  });
}

export const useAppSettings = () => {
  const syncQuery = useShouldSyncSettings();
  const sync = use(syncQuery.promise); // `React.use` should make this a synchronous value

  const settingsStore = useMemo(
    () => appSettingsStorage(sync ? "sync" : "local"),
    [sync]
  );
  const [settings, setSettings] = useChromeStorage(settingsStore);

  const changeSetting = async <K extends keyof AppSettings | "sync">(
    key: K,
    newValue: K extends keyof AppSettings ? AppSettings[K] : boolean
  ) => {
    if (key === "sync") {
      await shouldSyncStorage.setValue(newValue as boolean);
      return syncQuery.refetch();
    } else {
      return setSettings((prev) => ({ ...prev, [key]: newValue }));
    }
  };

  return {
    /** Whether user's settings are synced */
    sync,
    /** The user's global settings */
    settings,
    /** Change a specific global setting */
    changeSetting,
  };
};
