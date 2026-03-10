import { createContext, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { AuthResponse } from "../types/api";
import { clearAuth, loadAuth, saveAuth } from "../lib/auth-storage";
import { setAuthToken } from "../api/http";

type AuthContextType = {
  auth: AuthResponse | null;
  isNewUser: boolean;
  login: (data: AuthResponse, isNew?: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => {
    const data = loadAuth();
    setAuthToken(data?.token ?? null);
    return data;
  });
  const [isNewUser, setIsNewUser] = useState(false);

  const value = useMemo<AuthContextType>(
    () => ({
      auth,
      isNewUser,
      login: (data, isNew = false) => {
        setAuth(data);
        setIsNewUser(isNew);
        saveAuth(data);
        setAuthToken(data.token);
      },
      logout: () => {
        setAuth(null);
        setIsNewUser(false);
        clearAuth();
        setAuthToken(null);
      },
    }),
    [auth, isNewUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
