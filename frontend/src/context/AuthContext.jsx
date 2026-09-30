import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, getToken, saveToken, clearToken } from "../api";
import { setMyPerms } from "../roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we check a saved token with the backend on first load
  const [loading, setLoading] = useState(() => !!getToken());
  // permissions the super admin has given this department (Module Access); re-read every minute
  const [modules, setModules] = useState([]);

  const loadModules = useCallback(async () => {
    try {
      const m = await apiFetch("/api/admin/module-access");
      setMyPerms(m.mine);
      setModules(m.mine || []);
    } catch {
      setMyPerms([]);
      setModules([]);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setMyPerms([]);
    setModules([]);
    setUser(null);
  }, []);

  // On page load / refresh: if a token is saved, ask the backend if it is still valid.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    apiFetch("/api/auth/me")
      .then(async (me) => {
        if (cancelled) return;
        await loadModules();
        if (!cancelled) setUser({ email: me.email, name: me.name, role: me.role });
      })
      .catch(() => { if (!cancelled) clearToken(); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadModules]);

  // pick up access changes made by the super admin while this person is logged in
  useEffect(() => {
    if (!user) return undefined;
    const t = setInterval(loadModules, 60000);
    return () => clearInterval(t);
  }, [user, loadModules]);

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveToken(data.token);
    await loadModules();
    setUser({ email: data.email, name: data.name, role: data.role });
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, modules, reloadModules: loadModules }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
