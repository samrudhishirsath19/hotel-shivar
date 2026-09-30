import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, getToken, saveToken, clearToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we check a saved token with the backend on first load
  const [loading, setLoading] = useState(() => !!getToken());

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // On page load / refresh: if a token is saved, ask the backend if it is still valid.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    apiFetch("/api/auth/me")
      .then((me) => { if (!cancelled) setUser({ email: me.email, name: me.name, role: me.role }); })
      .catch(() => { if (!cancelled) clearToken(); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveToken(data.token);
    setUser({ email: data.email, name: data.name, role: data.role });
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
