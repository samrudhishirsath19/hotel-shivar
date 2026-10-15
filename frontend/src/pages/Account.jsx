import { useState } from "react";
import { Link } from "react-router-dom";
import { useCustomer, customerFetch } from "../context/CustomerContext";
import CustomerLoginForm from "../components/CustomerLoginForm";
import OrderStepper from "../components/OrderStepper";
import { fmtDateTime } from "../dates";
import { inr2, payable } from "../gst";
import { onlineStatusOf, onlineLabel } from "../orderStatus";
import { BOOKING_STATUS } from "./BookingTrack";

const inputCls = "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none";

// Room booking progress: received -> confirmed -> stay completed (or cancelled)
const BOOKING_STEPS = [["PENDING", "Received"], ["CONFIRMED", "Confirmed"], ["COMPLETED", "Stay completed"]];
function BookingSteps({ status }) {
  if (status === "CANCELLED") return <p className="text-xs font-semibold text-red-600">This booking was cancelled.</p>;
  const at = BOOKING_STEPS.findIndex(([s]) => s === status);
  return (
    <ol className="flex items-center gap-1 text-[11px]">
      {BOOKING_STEPS.map(([s, label], i) => (
        <li key={s} className="flex items-center gap-1 flex-1">
          <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-bold ${i <= at ? "bg-[#1F3B2D] text-white" : "bg-gray-200 text-gray-500"}`}>
            {i < at ? "✓" : i + 1}
          </span>
          <span className={i <= at ? "text-[#1F3B2D] font-semibold" : "text-gray-400"}>{label}</span>
          {i < BOOKING_STEPS.length - 1 && <span className={`flex-1 h-0.5 ${i < at ? "bg-[#1F3B2D]" : "bg-gray-200"}`} />}
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ o }) {
  const status = onlineStatusOf(o);
  const items = o.lines?.reduce((s, l) => s + l.quantity, 0) || 0;
  return (
    <li className="bg-white rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1F3B2D]">🍽️ Order #{o.id} · {items} item{items === 1 ? "" : "s"}</p>
          <p className="text-xs text-gray-500">{fmtDateTime(o.createdAt)} · {inr2(payable(o))}</p>
          {o.lines?.length > 0 && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{o.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")}</p>}
          {o.discountAmount > 0 && <p className="text-xs text-green-700 font-semibold">🏷️ Offer applied: {o.offerTitle || o.offerCode} · saved {inr2(o.discountAmount)}</p>}
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#1F3B2D] text-white whitespace-nowrap">{onlineLabel(status)}</span>
      </div>
      {status !== "CANCELLED" && <div className="mt-3"><OrderStepper status={status} compact /></div>}
      {o.trackingCode && (
        <Link to={`/order/${o.trackingCode}`} className="mt-3 inline-block text-sm font-semibold text-[#B8893C]">
          {status === "DELIVERED" || status === "CANCELLED" ? "View details →" : "Track order →"}
        </Link>
      )}
    </li>
  );
}

function BookingCard({ b }) {
  const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.PENDING;
  return (
    <li className="bg-white rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1F3B2D]">🛏️ Booking #{b.id} · {b.room?.name} (No. {b.room?.roomNumber})</p>
          <p className="text-xs text-gray-500">{b.checkIn} → {b.checkOut} · {b.numberOfGuests} guest{b.numberOfGuests > 1 ? "s" : ""} · {inr2(payable(b) || b.roomCharges)}</p>
          {b.discountAmount > 0 && <p className="text-xs text-green-700 font-semibold">🏷️ Offer applied: {b.offerTitle || b.offerCode} · saved {inr2(b.discountAmount)}</p>}
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${st.cls}`}>{st.label}</span>
      </div>
      <div className="mt-3"><BookingSteps status={b.status} /></div>
      {b.trackingCode && <Link to={`/booking/${b.trackingCode}`} className="mt-3 inline-block text-sm font-semibold text-[#B8893C]">View booking →</Link>}
    </li>
  );
}

function Dashboard() {
  const { customer, logout, bookings, orders, refresh, activeOrders, activeBookings } = useCustomer();
  const [tab, setTab] = useState("active");
  const [code, setCode] = useState("");
  const [claimMsg, setClaimMsg] = useState({ ok: "", error: "" });

  const claim = async (e) => {
    e.preventDefault();
    setClaimMsg({ ok: "", error: "" });
    if (!code.trim()) return;
    try {
      const r = await customerFetch("/api/customer/claim", { method: "POST", body: JSON.stringify({ code: code.trim() }) });
      setClaimMsg({ ok: `${r.type === "BOOKING" ? "Booking" : "Order"} #${r.id} added to your account.`, error: "" });
      setCode("");
      refresh();
    } catch (err) {
      setClaimMsg({ ok: "", error: err.message });
    }
  };

  const loading = bookings === null || orders === null;
  const TABS = [
    ["active", `Active (${activeOrders.length + activeBookings.length})`],
    ["orders", `Food orders (${orders?.length || 0})`],
    ["bookings", `Room bookings (${bookings?.length || 0})`],
  ];

  return (
    <div className="space-y-5">
      <div className="bg-[#1F3B2D] text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-[#B8893C] flex items-center justify-center text-xl font-bold">{customer.name.charAt(0).toUpperCase()}</span>
          <div>
            <h1 className="font-serif text-2xl">Hello, {customer.name.split(" ")[0]}</h1>
            <p className="text-xs text-white/70">+91 {customer.phone} · {customer.email}</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm border border-white/30 rounded-lg px-4 py-2 hover:bg-white/10">Log out</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${tab === id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white"}`}>{label}</button>
        ))}
        <span className="ml-auto text-xs text-green-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live - updates automatically
        </span>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <ul className="space-y-3">
          {tab === "active" && activeOrders.length + activeBookings.length === 0 && (
            <li className="bg-white rounded-2xl border p-6 text-center text-sm text-gray-500">
              Nothing in progress right now. <Link to="/restaurant" className="text-[#B8893C] font-semibold">Order food</Link> or <Link to="/rooms" className="text-[#B8893C] font-semibold">book a room</Link>.
            </li>
          )}
          {tab === "active" && activeOrders.map((o) => <OrderCard key={`o${o.id}`} o={o} />)}
          {tab === "active" && activeBookings.map((b) => <BookingCard key={`b${b.id}`} b={b} />)}

          {tab === "orders" && orders.length === 0 && <li className="bg-white rounded-2xl border p-6 text-center text-sm text-gray-500">No online orders yet. <Link to="/restaurant" className="text-[#B8893C] font-semibold">Order food</Link></li>}
          {tab === "orders" && orders.map((o) => <OrderCard key={o.id} o={o} />)}

          {tab === "bookings" && bookings.length === 0 && <li className="bg-white rounded-2xl border p-6 text-center text-sm text-gray-500">No bookings yet. <Link to="/rooms" className="text-[#B8893C] font-semibold">Book a room</Link></li>}
          {tab === "bookings" && bookings.map((b) => <BookingCard key={b.id} b={b} />)}
        </ul>
      )}

      <details className="bg-white rounded-2xl border p-5">
        <summary className="font-bold text-[#1F3B2D] cursor-pointer">Add an older booking or order</summary>
        <p className="text-sm text-gray-500 mt-2">Booked or ordered before you had an account? Paste the tracking link or code from the confirmation.</p>
        <form onSubmit={claim} className="mt-3 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BK... / HS... or the tracking link" className={inputCls} />
          <button className="bg-[#1F3B2D] text-white font-semibold px-5 rounded-xl">Add</button>
        </form>
        {claimMsg.ok && <p className="text-sm text-green-700 mt-2">{claimMsg.ok}</p>}
        {claimMsg.error && <p className="text-sm text-red-600 mt-2">{claimMsg.error}</p>}
      </details>
    </div>
  );
}

// /account: the guest's own login (mobile + OTP), separate from the staff panel.
export default function Account() {
  const { customer, checking } = useCustomer();
  return (
    <div className="bg-[#F3F5F1] min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {checking ? <p className="text-center text-gray-500">Loading...</p> : customer ? <Dashboard /> : (
          <div className="max-w-md mx-auto bg-white rounded-2xl border p-6 md:p-8">
            <h1 className="font-serif text-3xl text-[#1F3B2D]">Login or sign up</h1>
            <p className="text-sm text-gray-500 mt-1 mb-5">Book rooms, order food and track everything live.</p>
            <CustomerLoginForm />
            <p className="text-xs text-gray-400 mt-4 text-center">Hotel staff? Use the <Link to="/login" className="underline">staff login</Link>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
