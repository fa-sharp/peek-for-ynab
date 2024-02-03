import type { QueryFilters } from "@tanstack/react-query";
import {
  type PersistedQuery,
  experimental_createPersister
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

import { TWO_WEEKS_IN_MILLIS } from "./utils";

/** Creates an Indexed DB persister for React Query */
export const createIdbPersister = (prefix: string, filters: QueryFilters) =>
  experimental_createPersister<PersistedQuery>({
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
    buster: "v1"
  });
