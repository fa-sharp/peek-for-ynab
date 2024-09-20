import { QueryClient, type QueryFilters } from "@tanstack/react-query";
import {
  type PersistedQuery,
  experimental_createPersister
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

import { IS_PRODUCTION, TWO_WEEKS_IN_MILLIS } from "./utils";

const cachedQueryKeys = new Set(["budgets", "payees", "categoryGroups", "accounts"]);

/** React Query client, default settings */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: IS_PRODUCTION ? 1000 * 30 : 1000 * 10, // TODO evaluate stale time
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
    maxAge: TWO_WEEKS_IN_MILLIS,
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
