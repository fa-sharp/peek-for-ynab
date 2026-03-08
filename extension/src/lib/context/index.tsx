import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { createQueryClient } from "~lib/queryClient";
import { AuthProvider, useAuthContext } from "./authContext";
import { NotificationsProvider, useNotificationsContext } from "./notificationsContext";
import { StorageProvider, useStorageContext } from "./storageContext";
import { useYNABContext, YNABProvider } from "./ynabContext";

const queryClient = createQueryClient({ staleTime: 30 * 1000 }); // data is assumed fresh for 30 seconds

/** Provides auth, storage, and data contexts to the containing components */
const AppProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <StorageProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      <AuthProvider>
        <YNABProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </YNABProvider>
      </AuthProvider>
    </StorageProvider>
  </QueryClientProvider>
);

export {
  AppProvider,
  useAuthContext,
  useYNABContext,
  useNotificationsContext,
  useStorageContext,
};
