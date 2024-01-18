import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AuthProvider } from "~lib/context/authContext";
import { StorageProvider } from "~lib/context/storageContext";
import { YNABProvider } from "~lib/context/ynabContext";

export const createTestAppWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  return function wrapper({ children }: { children: ReactNode }) {
    return (
      <StorageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <YNABProvider>{children}</YNABProvider>
          </AuthProvider>
        </QueryClientProvider>
      </StorageProvider>
    );
  };
};