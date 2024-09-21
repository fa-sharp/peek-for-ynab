import { QueryClient, type QueryFilters } from "@tanstack/react-query";
import {
  type PersistedQuery,
  experimental_createPersister
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

import { ONE_DAY_IN_MILLIS } from "./utils";

const cachedQueryKeys = new Set(["budgets", "payees", "categoryGroups", "accounts"]);

export const createQueryClient = (options?: { staleTime?: number }) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: options?.staleTime,
        retry: 1, // only retry once if there's an error,
        persister: createIdbPersister("ynab", {
          predicate: ({ queryKey }) =>
            typeof queryKey[0] === "string" && cachedQueryKeys.has(queryKey[0])
        })
      }
    }
  });

/** Creates an Indexed DB persister for React Query */
function createIdbPersister(prefix: string, filters: QueryFilters) {
  return experimental_createPersister<PersistedQuery>({
    prefix,
    filters,
    maxAge: ONE_DAY_IN_MILLIS * 7,
    storage: {
      getItem: (key) => get(key),
      setItem: (key, val) => set(key, val),
      removeItem: (key) => del(key)
    },
    serialize: (query) => query,
    deserialize: (query) => query,
    buster: "v2"
  });
}
