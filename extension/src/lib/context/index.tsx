import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { DevTools } from "jotai-devtools";
import jotaiDevtoolsCss from "jotai-devtools/styles.css?inline";
import type { ReactNode } from "react";

import { IS_DEV } from "~lib/constants";
import { createQueryClient } from "~lib/queryClient";
import { AuthProvider, useAuthContext } from "./authContext";
import { NotificationsProvider, useNotificationsContext } from "./notificationsContext";
import { StorageProvider, useStorageContext } from "./storageContext";
import { useYNABContext, YNABProvider } from "./ynabContext";

const queryClient = createQueryClient({ staleTime: 30 * 1000 }); // data is assumed fresh for 30 seconds

/** Provides auth, storage, and data contexts to the containing components */
const AppProvider = ({ children }: { children: ReactNode }) => (
  <>
    <JotaiDevTools />
    <StorageProvider>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        <AuthProvider>
          <YNABProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </YNABProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StorageProvider>
  </>
);

const JotaiDevTools = () =>
  IS_DEV ? (
    <>
      <style>{jotaiDevtoolsCss}</style>
      <DevTools />
    </>
  ) : null;

export {
  AppProvider,
  useAuthContext,
  useYNABContext,
  useNotificationsContext,
  useStorageContext
};
