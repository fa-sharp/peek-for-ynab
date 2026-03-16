import { AuthContext, useAuthProvider } from "./authContext";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthProvider();

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
