import { storage } from "#imports";
import { LATEST_VERSION_ALERT_NUM, STORAGE_KEYS } from "~lib/constants";
import type { CurrentAlerts } from "~lib/notifications";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

export const currentAlertsStorage = storage.defineItem<CurrentAlerts>(
  `local:${STORAGE_KEYS.CurrentAlerts}`,
  {
    fallback: {},
    version: 2,
    migrations: {
      2: () => ({}),
    },
  }
);

export const versionAlertStorage = storage.defineItem<number>(
  `sync:${STORAGE_KEYS.VersionAlert}`,
  {
    init: () => LATEST_VERSION_ALERT_NUM,
    fallback: LATEST_VERSION_ALERT_NUM,
    version: 2,
    migrations: {
      2: safeMigrateJsonString<number>(LATEST_VERSION_ALERT_NUM),
    },
  }
);

export const useCurrentAlerts = () => useChromeStorage(currentAlertsStorage);
export const useVersionAlert = () => useChromeStorage(versionAlertStorage);
