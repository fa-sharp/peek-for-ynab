import { QueryClient } from "@tanstack/react-query";
import {
  experimental_createQueryPersister,
  type PersistedQuery,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

import { browser, storage } from "#imports";
import { FIVE_MINUTES_IN_MILLIS, ONE_DAY_IN_MILLIS } from "./constants";

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

const CACHE_PREFIX = "ynab";
const CACHED_QUERY_KEYS = new Set([
  "budgets",
  "payees",
  "categoryGroups",
  "accounts",
  "import",
]);

/** Persist queries to IndexedDB using idb-keyval */
const queryPersister = experimental_createQueryPersister<PersistedQuery>({
  prefix: CACHE_PREFIX,
  filters: {
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === "string" && CACHED_QUERY_KEYS.has(queryKey[0]),
  },
  maxAge: ONE_DAY_IN_MILLIS * 7,
  storage: {
    getItem: (key) => get(key),
    setItem: (key, val) => set(key, val),
    removeItem: (key) => del(key),
  },
  serialize: (query) => query,
  deserialize: (query) => query,
  buster: "v2",
});

/** Persist access token to browser session storage (in-memory only) */
export const tokenPersister = experimental_createQueryPersister<PersistedQuery>({
  prefix: CACHE_PREFIX,
  maxAge: FIVE_MINUTES_IN_MILLIS, // access token should be valid for 5 minutes
  storage: {
    getItem: (key) => storage.getItem(`session:${key}`),
    setItem: (key, val) => storage.setItem(`session:${key}`, val),
    removeItem: (key) => storage.removeItem(`session:${key}`),
    entries: async () => {
      const entries = await browser.storage.session.get();
      return Object.entries(entries) as [string, PersistedQuery][];
    },
  },
  serialize: (query) => query,
  deserialize: (query) => query,
});
