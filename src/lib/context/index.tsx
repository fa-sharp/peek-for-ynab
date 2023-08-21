import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";

import { createIDBPersister } from "~lib/indexedDBPersister";
import { IS_PRODUCTION, TWO_WEEKS_IN_MILLIS } from "~lib/utils";

import { AuthProvider, useAuthContext } from "./authContext";
import { StorageProvider, useStorageContext } from "./storageContext";
import { YNABProvider, useYNABContext } from "./ynabContext";

/** React Query client, default settings */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: IS_PRODUCTION ? 1000 * 30 : 1000 * 60 * 5, // 30 seconds in prod, 5 minutes in dev
      cacheTime: 1000 * 60 * 30, // 30 minute cache
      refetchOnWindowFocus: false, // don't refetch on window focus
      retry: 1 // only retry once if there's an error
    }
  }
});

/** Indexed DB cache for React Query */
const persister = createIDBPersister();

/** Provides auth, storage, and data contexts to the containing components */
const AppProvider = ({ children }: { children: ReactNode }) => (
  <StorageProvider>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: TWO_WEEKS_IN_MILLIS * 2
      }}>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      <AuthProvider>
        <YNABProvider>{children}</YNABProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StorageProvider>
);

export { AppProvider, useAuthContext, useYNABContext, useStorageContext };
