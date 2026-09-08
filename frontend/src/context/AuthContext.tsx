import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  registerAuthLostHandler,
  setAccessToken,
} from "@/lib/api";
import type { AxiosResponse } from "axios";
import type { AuthResponse, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: (everywhere?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Single-flights the initial restore across a StrictMode double-mount.
  const initialRefresh = useRef<Promise<AxiosResponse<AuthResponse>> | null>(null);

  const applySession = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async (everywhere = false) => {
    try {
      await api.post(everywhere ? "/auth/logout-all" : "/auth/logout");
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerAuthLostHandler(() => {
      setAccessToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    initialRefresh.current ??= api.post<AuthResponse>("/auth/refresh");
    initialRefresh.current
      .then(({ data }) => applySession(data))
      .catch(() => {
        /* not signed in */
      })
      .finally(() => setLoading(false));
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      applySession(data);
    },
    [applySession],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/signup", {
        name,
        email,
        password,
      });
      applySession(data);
    },
    [applySession],
  );

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ user: User }>("/auth/me");
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
