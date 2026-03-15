import {
  experimental_createQueryPersister,
  type PersistedQuery,
} from "@tanstack/query-persist-client-core";
import { QueryClient } from "@tanstack/react-query";
import { del, entries, get, set } from "idb-keyval";

import { ONE_DAY_IN_MILLIS } from "./constants";

export function createQueryClient(options?: { staleTime?: number }) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: options?.staleTime,
        retry: 1, // only retry once if there's an error,
        persister: queryPersister.persisterFn, // persist the query cache to IndexedDB
        experimental_prefetchInRender: true, // enable React.use() with queries
      },
    },
  });
}

const CACHED_QUERY_KEYS = new Set([
  "budgets",
  "payees",
  "categoryGroups",
  "accounts",
  "import",
]);

/** Persist queries to IndexedDB using idb-keyval */
export const queryPersister = experimental_createQueryPersister<PersistedQuery>({
  prefix: "ynab",
  filters: {
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === "string" && CACHED_QUERY_KEYS.has(queryKey[0]),
  },
  maxAge: ONE_DAY_IN_MILLIS * 7,
  storage: {
    getItem: (key) => get(key),
    setItem: (key, val) => set(key, val),
    removeItem: (key) => del(key),
    entries: () => entries(),
  },
  serialize: (query) => query,
  deserialize: (query) => query,
  buster: "v2",
});
