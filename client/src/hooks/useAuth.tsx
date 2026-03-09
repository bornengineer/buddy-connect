import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { AuthResponse } from '../types/api';
import { clearAuth, loadAuth, saveAuth } from '../lib/auth-storage';
import { setAuthToken } from '../api/http';

type AuthContextType = {
  auth: AuthResponse | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => {
    const data = loadAuth();
    setAuthToken(data?.token ?? null);
    return data;
  });

  const value = useMemo<AuthContextType>(
    () => ({
      auth,
      login: (data) => {
        setAuth(data);
        saveAuth(data);
        setAuthToken(data.token);
      },
      logout: () => {
        setAuth(null);
        clearAuth();
        setAuthToken(null);
      }
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
