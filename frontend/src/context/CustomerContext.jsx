import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { onlineStatusOf, onlineLabel } from "../orderStatus";
import CustomerLoginSheet from "../components/CustomerLoginSheet";

// Website customer account (separate from the staff login): its own token in its own storage key.
const KEY = "hs_customer_token";
const CustomerContext = createContext(null);
const LIVE_MS = 8000; // how often a logged-in customer's bookings / orders are refreshed

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

// Orders that are still on their way / bookings still coming up (shown as "active" in the navbar)
const isActiveOrder = (o) => !["DELIVERED", "CANCELLED"].includes(onlineStatusOf(o));
const isActiveBooking = (b) => (b.status === "PENDING" || b.status === "CONFIRMED") && b.checkOut >= new Date().toISOString().slice(0, 10);

const BOOKING_TEXT = { CONFIRMED: "is confirmed ✅", COMPLETED: "is completed - thank you for staying with us!", CANCELLED: "was cancelled" };
const ORDER_ICON = { CONFIRMED: "👨‍🍳", PREPARING: "🍳", READY: "📦", OUT_FOR_DELIVERY: "🛵", DELIVERED: "✅", CANCELLED: "❌" };

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(() => !!read());
  const [bookings, setBookings] = useState(null);
  const [orders, setOrders] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sheet, setSheet] = useState(null); // { reason, resolve } while the login sheet is open
  const seen = useRef(null);                  // last known statuses, to notice changes

  const logout = useCallback(() => {
    write(null);
    setCustomer(null);
    setBookings(null);
    setOrders(null);
    seen.current = null;
  }, []);

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

  const notify = useCallback((text, link) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, link }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
  }, []);

  // live updates: refresh bookings + orders and tell the customer when a status changes
  const refresh = useCallback(async () => {
    if (!read()) return;
    try {
      const [b, o] = await Promise.all([customerFetch("/api/customer/bookings"), customerFetch("/api/customer/orders")]);
      const now = {};
      (b || []).forEach((x) => { now[`b${x.id}`] = x.status; });
      (o || []).forEach((x) => { now[`o${x.id}`] = onlineStatusOf(x); });
      const before = seen.current;
      if (before) {
        (o || []).forEach((x) => {
          const st = now[`o${x.id}`];
          if (before[`o${x.id}`] && before[`o${x.id}`] !== st) {
            notify(`${ORDER_ICON[st] || "🔔"} Order #${x.id}: ${onlineLabel(st)}`, x.trackingCode ? `/order/${x.trackingCode}` : "/account");
          }
        });
        (b || []).forEach((x) => {
          const st = now[`b${x.id}`];
          if (before[`b${x.id}`] && before[`b${x.id}`] !== st && BOOKING_TEXT[st]) {
            notify(`🛏️ Booking #${x.id} ${BOOKING_TEXT[st]}`, x.trackingCode ? `/booking/${x.trackingCode}` : "/account");
          }
        });
      }
      seen.current = now;
      setBookings(b || []);
      setOrders(o || []);
    } catch (e) {
      if (e.status === 401) logout();
    }
  }, [logout, notify]);

  useEffect(() => {
    if (!customer) return undefined;
    refresh();
    const t = setInterval(() => { if (!document.hidden) refresh(); }, LIVE_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [customer, refresh]);

  const start = (s) => { write(s.token); setCustomer(s.customer); return s.customer; };

  // email / mobile + password (accounts that have a password)
  const login = async (login, password) =>
    start(await apiFetch("/api/customer/login", { method: "POST", body: JSON.stringify({ login, password }) }));

  const register = async (form) =>
    start(await apiFetch("/api/customer/register", { method: "POST", body: JSON.stringify(form) }));

  // mobile number + OTP (like Swiggy / Zomato)
  const sendOtp = (phone) => apiFetch("/api/customer/otp/send", { method: "POST", body: JSON.stringify({ phone }) });
  const verifyOtp = async (details) =>
    start(await apiFetch("/api/customer/otp/verify", { method: "POST", body: JSON.stringify(details) }));

  // Opens the login sheet when nobody is logged in. Resolves true once logged in, false if closed.
  const ensureLogin = useCallback((reason) => {
    if (customer) return Promise.resolve(true);
    return new Promise((resolve) => setSheet({ reason, resolve }));
  }, [customer]);

  const closeSheet = (ok) => {
    sheet?.resolve(ok);
    setSheet(null);
  };

  const activeOrders = (orders || []).filter(isActiveOrder);
  const activeBookings = (bookings || []).filter(isActiveBooking);

  return (
    <CustomerContext.Provider value={{
      customer, checking, login, register, logout, sendOtp, verifyOtp, ensureLogin,
      bookings, orders, refresh, activeOrders, activeBookings,
    }}>
      {children}
      {sheet && <CustomerLoginSheet reason={sheet.reason} onDone={() => closeSheet(true)} onClose={() => closeSheet(false)} />}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-4 z-[120] space-y-2 w-[min(92vw,340px)]" role="status" aria-live="polite">
          {toasts.map((t) => (
            <Link key={t.id} to={t.link || "/account"}
              className="block bg-[#1F3B2D] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg border border-white/10 hover:bg-black">
              {t.text}
              <span className="block text-[11px] text-white/70 mt-0.5">Tap to track</span>
            </Link>
          ))}
        </div>
      )}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used inside <CustomerProvider>");
  return ctx;
}
