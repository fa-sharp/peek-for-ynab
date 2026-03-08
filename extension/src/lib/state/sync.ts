import { useQuery } from "@tanstack/react-query";

import { storage } from "#imports";
import { STORAGE_KEYS } from "~lib/constants";
import { safeMigrateJsonString } from "./utils";

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

export const useShouldSyncQuery = () => {
  return useQuery({
    queryKey: [STORAGE_KEYS.ShouldSyncSettings],
    queryFn: shouldSyncStorage.getValue,
    staleTime: Infinity,
  });
};
