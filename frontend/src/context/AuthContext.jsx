import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  api,
  setAccessToken,
  registerAuthLostHandler,
} from "../api/axiosClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
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

  // Attempt silent restore on first load via the refresh cookie.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post("/auth/refresh");
        applySession(data);
      } catch {
        /* not logged in */
      } finally {
        setLoading(false);
      }
    })();
  }, [applySession]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/auth/login", { email, password });
      applySession(data);
    },
    [applySession]
  );

  const signup = useCallback(
    async (name, email, password) => {
      const { data } = await api.post("/auth/signup", { name, email, password });
      applySession(data);
    },
    [applySession]
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
