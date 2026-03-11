import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AuthProvider } from "~lib/context/authContext";
import { NotificationsProvider } from "~lib/context/notificationsContext";
import StorageProvider from "~lib/context/storageProvider";
import { YNABProvider } from "~lib/context/ynabContext";

export const createTestAppWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        experimental_prefetchInRender: true,
      },
    },
  });
  return function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <StorageProvider>
          <AuthProvider>
            <YNABProvider>
              <NotificationsProvider>{children}</NotificationsProvider>
            </YNABProvider>
          </AuthProvider>
        </StorageProvider>
      </QueryClientProvider>
    );
  };
};
