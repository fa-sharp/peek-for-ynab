import { useYNABProvider, YNABContext } from "./ynabContext";

export default function YNABProvider({ children }: { children: React.ReactNode }) {
  const value = useYNABProvider();

  return <YNABContext.Provider value={value}>{children}</YNABContext.Provider>;
}
