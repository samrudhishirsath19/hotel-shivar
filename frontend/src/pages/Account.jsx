import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCustomer, customerFetch } from "../context/CustomerContext";
import { digits10 } from "../roles";
import { fmtDateTime } from "../dates";
import { inr2, payable } from "../gst";
import { onlineStatusOf, onlineLabel } from "../orderStatus";
import { BOOKING_STATUS } from "./BookingTrack";

const inputCls = "mt-1 w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none";

// Log in / sign up (customer accounts are separate from the staff login)
function AuthForms() {
  const { login, register } = useCustomer();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ login: "", name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      if (mode === "login") await login(form.login.trim(), form.password);
      else await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border p-6 md:p-8">
      <div className="grid grid-cols-2 gap-1 bg-[#F3F5F1] p-1 rounded-xl text-sm font-semibold">
        {[["login", "Log in"], ["register", "Create account"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setMode(id); setError(""); }}
            className={`py-2 rounded-lg ${mode === id ? "bg-white shadow text-[#1F3B2D]" : "text-gray-500"}`}>{label}</button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-4">
        {mode === "login" ? "Track your room bookings and food orders." : "Bookings and orders you make while logged in are saved here."}
      </p>
      {error && <p role="alert" className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}
      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === "login" ? (
          <div>
            <label className="text-sm font-medium" htmlFor="c-login">Email or mobile number</label>
            <input id="c-login" value={form.login} onChange={set("login")} autoComplete="username" className={inputCls} />
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium" htmlFor="c-name">Full name</label>
              <input id="c-name" value={form.name} onChange={set("name")} autoComplete="name" className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="c-phone">Mobile number</label>
              <input id="c-phone" value={form.phone} inputMode="numeric" placeholder="10-digit number"
                onChange={(e) => { const v = digits10(e.target.value); setForm((f) => ({ ...f, phone: v })); }} className={inputCls} />
            </div>
          </>
        )}
        <div>
          <label className="text-sm font-medium" htmlFor="c-pass">Password</label>
          <input id="c-pass" type="password" value={form.password} onChange={set("password")}
            autoComplete={mode === "login" ? "current-password" : "new-password"} className={inputCls} />
        </div>
        <button disabled={busy} className="w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-60">
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-4 text-center">Hotel staff? Use the <Link to="/login" className="underline">staff login</Link>.</p>
    </div>
  );
}

function Dashboard() {
  const { customer, logout } = useCustomer();
  const [bookings, setBookings] = useState(null);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [claimMsg, setClaimMsg] = useState({ ok: "", error: "" });

  const load = useCallback(() => {
    Promise.all([customerFetch("/api/customer/bookings"), customerFetch("/api/customer/orders")])
      .then(([b, o]) => { setBookings(b || []); setOrders(o || []); setError(""); })
      .catch((e) => { if (e.status === 401) logout(); else setError(e.message); });
  }, [logout]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000); // order statuses change while the guest watches
    return () => clearInterval(t);
  }, [load]);

  const claim = async (e) => {
    e.preventDefault();
    setClaimMsg({ ok: "", error: "" });
    if (!code.trim()) return;
    try {
      const r = await customerFetch("/api/customer/claim", { method: "POST", body: JSON.stringify({ code: code.trim() }) });
      setClaimMsg({ ok: `${r.type === "BOOKING" ? "Booking" : "Order"} #${r.id} added to your account.`, error: "" });
      setCode("");
      load();
    } catch (err) {
      setClaimMsg({ ok: "", error: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#1F3B2D]">Hello, {customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.email} · {customer.phone}</p>
        </div>
        <button onClick={logout} className="text-sm border rounded-lg px-4 py-2 bg-white">Log out</button>
      </div>
      {error && <p role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <section className="bg-white rounded-2xl border p-5">
        <h2 className="font-bold text-[#1F3B2D]">My room bookings</h2>
        {bookings === null ? <p className="text-sm text-gray-500 mt-2">Loading...</p>
          : bookings.length === 0 ? <p className="text-sm text-gray-500 mt-2">No bookings yet.</p> : (
            <ul className="mt-3 divide-y">
              {bookings.map((b) => {
                const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.PENDING;
                return (
                  <li key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold">#{b.id} · {b.room?.name} (No. {b.room?.roomNumber})</p>
                      <p className="text-gray-500">{b.checkIn} → {b.checkOut} · {inr2(payable(b) || b.roomCharges)}</p>
                      {b.discountAmount > 0 && <p className="text-xs text-green-700 font-semibold">🏷️ Offer applied: {b.offerTitle || b.offerCode} · saved {inr2(b.discountAmount)}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${st.cls}`}>{st.label}</span>
                      {b.trackingCode && <Link to={`/booking/${b.trackingCode}`} className="text-[#B8893C] font-semibold">View</Link>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
      </section>

      <section className="bg-white rounded-2xl border p-5">
        <h2 className="font-bold text-[#1F3B2D]">My food orders</h2>
        {orders === null ? <p className="text-sm text-gray-500 mt-2">Loading...</p>
          : orders.length === 0 ? <p className="text-sm text-gray-500 mt-2">No online orders yet. <Link to="/restaurant" className="underline">Order food</Link></p> : (
            <ul className="mt-3 divide-y">
              {orders.map((o) => (
                <li key={o.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-semibold">#{o.id} · {o.lines?.reduce((s, l) => s + l.quantity, 0) || 0} item(s)</p>
                    <p className="text-gray-500">{fmtDateTime(o.createdAt)} · {inr2(payable(o))}</p>
                    {o.discountAmount > 0 && <p className="text-xs text-green-700 font-semibold">🏷️ Offer applied: {o.offerTitle || o.offerCode} · saved {inr2(o.discountAmount)}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-[#1F3B2D] text-white">{onlineLabel(onlineStatusOf(o))}</span>
                    {o.trackingCode && <Link to={`/order/${o.trackingCode}`} className="text-[#B8893C] font-semibold">Track</Link>}
                  </div>
                </li>
              ))}
            </ul>
          )}
      </section>

      <section className="bg-white rounded-2xl border p-5">
        <h2 className="font-bold text-[#1F3B2D]">Add a booking or order</h2>
        <p className="text-sm text-gray-500">Booked or ordered without logging in? Paste the tracking link or code from the confirmation.</p>
        <form onSubmit={claim} className="mt-3 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BK... / HS... or the tracking link" className={inputCls.replace("mt-1 ", "")} />
          <button className="bg-[#1F3B2D] text-white font-semibold px-5 rounded-xl">Add</button>
        </form>
        {claimMsg.ok && <p className="text-sm text-green-700 mt-2">{claimMsg.ok}</p>}
        {claimMsg.error && <p className="text-sm text-red-600 mt-2">{claimMsg.error}</p>}
      </section>
    </div>
  );
}

// /account: the guest's own login, separate from the staff panel.
export default function Account() {
  const { customer, checking } = useCustomer();
  return (
    <div className="bg-[#F3F5F1] min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {checking ? <p className="text-center text-gray-500">Loading...</p> : customer ? <Dashboard /> : (
          <>
            <h1 className="font-serif text-3xl text-[#1F3B2D] text-center mb-6">My Account</h1>
            <AuthForms />
          </>
        )}
      </div>
    </div>
  );
}
