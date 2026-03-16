import { StorageContext, useStorageProvider } from "./storageContext";

export default function StorageProvider({ children }: { children: React.ReactNode }) {
  const value = useStorageProvider();
  if (!value) return null;

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
