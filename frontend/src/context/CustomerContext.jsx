import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "../api";

// Website customer account (separate from the staff login): its own token in its own storage key.
const KEY = "hs_customer_token";
const CustomerContext = createContext(null);

const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (t) => { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch { /* storage blocked */ } };

// Authorization header for a customer call (or for a public call that should be added to the account)
export const customerAuth = () => {
  const t = read();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// fetch for customer-only URLs (/api/customer/...)
export const customerFetch = (path, options = {}) =>
  apiFetch(path, { ...options, headers: { ...(options.headers || {}), ...customerAuth() } });

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(() => !!read());

  const logout = useCallback(() => { write(null); setCustomer(null); }, []);

  // a saved login: check it is still valid
  useEffect(() => {
    if (!read()) return;
    let cancelled = false;
    customerFetch("/api/customer/me")
      .then((c) => { if (!cancelled) setCustomer(c); })
      .catch(() => { if (!cancelled) write(null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  const start = (s) => { write(s.token); setCustomer(s.customer); return s.customer; };

  const login = async (login, password) =>
    start(await apiFetch("/api/customer/login", { method: "POST", body: JSON.stringify({ login, password }) }));

  const register = async (form) =>
    start(await apiFetch("/api/customer/register", { method: "POST", body: JSON.stringify(form) }));

  return (
    <CustomerContext.Provider value={{ customer, checking, login, register, logout }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used inside <CustomerProvider>");
  return ctx;
}
