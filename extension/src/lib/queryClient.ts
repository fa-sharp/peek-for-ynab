import { QueryClient } from "@tanstack/react-query";
import {
  experimental_createQueryPersister,
  type PersistedQuery
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

import { ONE_DAY_IN_MILLIS } from "./constants";

const CACHED_QUERY_KEYS = new Set([
  "budgets",
  "payees",
  "categoryGroups",
  "accounts",
  "import"
]);

const queryPersister = experimental_createQueryPersister<PersistedQuery>({
  prefix: "ynab",
  filters: {
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === "string" && CACHED_QUERY_KEYS.has(queryKey[0])
  },
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

export const createQueryClient = (options?: { staleTime?: number }) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: options?.staleTime,
        retry: 1, // only retry once if there's an error,
        persister: queryPersister.persisterFn
      }
    }
  });
