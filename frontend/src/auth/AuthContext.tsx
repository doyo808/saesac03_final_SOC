import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  refresh as refreshApi,
} from "../api/authApi";
import { clearAccessToken, getAccessToken, setAccessToken } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const reloadUser = async () => {
    const me = await meApi();
    setUser(me);
  };

  const bootstrap = async () => {
    try {
      // Reuse token persisted in the current browser session before refresh fallback.
      if (getAccessToken()) {
        try {
          await reloadUser();
          return;
        } catch {
          clearAccessToken();
        }
      }

      const token = await refreshApi();
      setAccessToken(token.accessToken);
      await reloadUser();
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setInitializing(false);
    }
  };

  const login = async (email: string, password: string) => {
    const token = await loginApi(email, password);
    setAccessToken(token.accessToken);
    await reloadUser();
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      logout,
      reloadUser,
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
