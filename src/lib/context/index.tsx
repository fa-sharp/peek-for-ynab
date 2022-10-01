import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { AuthProvider, useAuthContext } from "./authContext";
import { StorageProvider, useStorageContext } from "./storageContext";
import { YNABProvider, queryClient, useYNABContext } from "./ynabContext";

/** Provides auth, storage, and data contexts to the containing components */
const AppProvider = ({ children }: { children: ReactNode }) => (
  <StorageProvider>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AuthProvider>
        <YNABProvider>{children}</YNABProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StorageProvider>
);

export { AppProvider, useAuthContext, useYNABContext, useStorageContext };
