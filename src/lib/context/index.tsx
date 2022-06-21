import type { ReactNode } from "react";

import { AuthProvider, useAuthContext } from "./authContext";
import { StorageProvider, useStorageContext } from "./storageContext";
import { YNABProvider, useYNABContext } from "./ynabContext";

/** Provides auth, storage, and data contexts to the containing components */
const AppProvider = ({ children }: { children: ReactNode }) => (
  <StorageProvider>
    <AuthProvider>
      <YNABProvider>{children}</YNABProvider>
    </AuthProvider>
  </StorageProvider>
);

export { AppProvider, useAuthContext, useYNABContext, useStorageContext };
