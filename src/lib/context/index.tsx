import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { createIdbPersister } from "~lib/indexedDBPersister";
import { IS_PRODUCTION } from "~lib/utils";

import { AuthProvider, useAuthContext } from "./authContext";
import { StorageProvider, useStorageContext } from "./storageContext";
import { YNABProvider, useYNABContext } from "./ynabContext";

/** Queries that should be cached */
const cachedQueryKeys = new Set(["budgets", "payees"]);

/** React Query client, default settings */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: IS_PRODUCTION ? 1000 * 30 : 1000 * 60 * 5, // 30 seconds in prod, 5 minutes in dev
      refetchOnWindowFocus: false, // don't refetch on window focus
      retry: 1, // only retry once if there's an error,
      persister: createIdbPersister("ynab", {
        predicate: ({ queryKey }) =>
          typeof queryKey[0] === "string" && cachedQueryKeys.has(queryKey[0])
      })
    }
  }
});

/** Provides auth, storage, and data contexts to the containing components */
const AppProvider = ({ children }: { children: ReactNode }) => (
  <StorageProvider>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      <AuthProvider>
        <YNABProvider>{children}</YNABProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StorageProvider>
);

export { AppProvider, useAuthContext, useYNABContext, useStorageContext };
