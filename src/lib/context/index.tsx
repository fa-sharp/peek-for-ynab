import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";

import { createIDBPersister } from "~lib/indexedDBPersister";
import { TWO_WEEKS_IN_MILLIS } from "~lib/utils";

import { AuthProvider, useAuthContext } from "./authContext";
import { StorageProvider, useStorageContext } from "./storageContext";
import { YNABProvider, useYNABContext } from "./ynabContext";

/** React Query client, default settings */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // data stays fresh for 30 seconds
      cacheTime: 1000 * 60 * 60, // 1 hour cache
      refetchOnWindowFocus: false // don't refetch on window focus
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
        maxAge: TWO_WEEKS_IN_MILLIS
      }}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AuthProvider>
        <YNABProvider>{children}</YNABProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StorageProvider>
);

export { AppProvider, useAuthContext, useYNABContext, useStorageContext };
