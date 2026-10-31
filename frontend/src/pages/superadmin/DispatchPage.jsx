import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { onlineStatusOf } from "../../orderStatus";
import { fmtTime, minutesSince } from "../../dates";
import { payable, inr2 } from "../../gst";
import { PageTitle } from "./ui";
import { Toast } from "./Ticket";
import AcceptCountdown from "../../components/AcceptCountdown";

const load = (b) => (b.activeOrders === 0 ? "free" : `${b.activeOrders} order${b.activeOrders > 1 ? "s" : ""}`);

// One Ready order: who will take it, and the Dispatch button.
function DispatchCard({ o, boys, dispatch, reload }) {
  const [pick, setPick] = useState("");
  const dispatched = !!o.dispatchedAt;
  const chosen = pick ? Number(pick) : o.deliveryBoyId;
  const chosenName = pick ? boys.find((b) => b.id === Number(pick))?.name : o.deliveryBoyName;
  const items = o.lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <article className={`bg-white rounded-2xl border-2 p-4 ${dispatched ? "border-blue-300" : "border-green-400"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900">Order #{o.id}</h3>
          <p className="text-[11px] text-gray-500">Placed {fmtTime(o.createdAt)} · {minutesSince(o.createdAt)} min ago · {items} item{items === 1 ? "" : "s"}</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${dispatched ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
          {dispatched ? `Dispatched ${fmtTime(o.dispatchedAt)}` : "✅ Ready"}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold">👤 {o.customerName} · <a href={`tel:${o.customerPhone}`} className="underline font-normal">{o.customerPhone}</a></p>
      <p className="text-xs text-gray-600">📍 {o.deliveryAddress}</p>
      <p className="text-xs text-gray-600 mt-1">{o.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")}</p>
      <p className={`mt-2 text-xs font-semibold ${o.paymentStatus === "PAID" ? "text-green-700" : "text-amber-700"}`}>
        {o.paymentStatus === "PAID" ? "✔ Paid online" : `💵 Cash on delivery: ${inr2(payable(o))}`}
      </p>

      <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
        <p className="text-xs text-gray-500">Delivery boy</p>
        <p className="font-semibold">
          {o.deliveryBoyName ? `🛵 ${o.deliveryBoyName}` : <span className="text-red-600">Not assigned - choose one</span>}
          {o.deliveryAssignedBy === "Auto-assigned" && !dispatched && <span className="ml-1 text-[11px] font-normal text-gray-500">(suggested automatically)</span>}
        </p>
        {dispatched && <p className="text-[11px] text-blue-700">Waiting for {o.deliveryBoyName} to accept - then it goes Out for Delivery</p>}
        {dispatched && o.acceptBy && <div className="mt-2"><AcceptCountdown until={o.acceptBy} who={o.deliveryBoyName?.split(" ")[0]} onExpire={reload} /></div>}
        {!dispatched && o.acceptTimedOutBy && (
          <p className="mt-1 text-[11px] font-semibold text-red-700">⏱ {o.acceptTimedOutBy} did not accept within 2 minutes - dispatch it again</p>
        )}
        <div className="mt-2 flex gap-2">
          <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`Delivery boy for order ${o.id}`}
            className="flex-1 min-w-0 border rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="">{o.deliveryBoyName ? `Keep ${o.deliveryBoyName}` : "Choose delivery boy..."}</option>
            {boys.filter((b) => b.active && b.id !== o.deliveryBoyId).map((b) => (
              <option key={b.id} value={b.id}>{b.name} - {load(b)}</option>
            ))}
          </select>
        </div>
        <button disabled={!chosen} onClick={() => { dispatch(o, pick ? Number(pick) : null, chosenName); setPick(""); }}
          className={`mt-2 w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-40 ${dispatched ? "bg-white border-2 border-blue-600 text-blue-700" : "bg-[#1F3B2D] text-white"}`}>
          {dispatched ? (pick ? `🔁 Re-dispatch to ${chosenName}` : `🔁 Dispatch again to ${o.deliveryBoyName}`) : `🚀 Dispatch${chosenName ? " to " + chosenName : ""}`}
        </button>
      </div>
    </article>
  );
}

// Delivery Dispatch (Order User): Ready orders -> choose the delivery boy -> Dispatch.
// The delivery boy accepts on his phone and the order goes Out for Delivery automatically.
export default function DispatchPage() {
  const { logout } = useAuth();
  const [orders, setOrders] = useState(null);
  const [boys, setBoys] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3500); };

  const refresh = useCallback(async () => {
    try {
      const [o, b] = await Promise.all([apiFetch("/api/admin/online-orders?days=1"), apiFetch("/api/admin/delivery-boys")]);
      setOrders(o || []);
      setBoys(b || []);
      setError("");
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [logout]);

  useEffect(() => {
    refresh();
    const t = setInterval(() => { if (!document.hidden) refresh(); }, 5000); // live
    return () => clearInterval(t);
  }, [refresh]);

  const dispatch = async (o, boyId, name) => {
    try {
      const saved = await apiFetch(`/api/admin/online-orders/${o.id}/dispatch`, { method: "POST", body: JSON.stringify({ deliveryBoyId: boyId }) });
      flash(`🚀 Order #${o.id} dispatched to ${saved.deliveryBoyName || name}`);
      refresh();
    } catch (e) {
      flash("⚠️ " + e.message);
      refresh();
    }
  };

  const list = orders || [];
  const st = (o) => onlineStatusOf(o);
  const toDispatch = list.filter((o) => st(o) === "READY" && !o.dispatchedAt);
  const waiting = list.filter((o) => st(o) === "READY" && o.dispatchedAt);
  const out = list.filter((o) => st(o) === "OUT_FOR_DELIVERY");
  const cooking = list.filter((o) => ["CONFIRMED", "PREPARING"].includes(st(o)));
  const onDuty = boys.filter((b) => b.active);

  const column = (title, hint, rows, tone, render) => (
    <section>
      <h2 className={`font-bold ${tone}`}>{title} ({rows.length})</h2>
      <p className="text-xs text-gray-500 mb-3">{hint}</p>
      {orders && rows.length === 0 && <p className="text-sm text-gray-400 bg-white border border-dashed rounded-xl p-4 text-center">Nothing here</p>}
      <div className="space-y-3">{rows.map(render)}</div>
    </section>
  );

  return (
    <div>
      <Toast msg={msg} />
      <PageTitle title="Delivery Dispatch" sub="Kitchen marks Ready → you dispatch it to a delivery boy → he accepts → Out for Delivery (automatic)." />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="mb-5 bg-white border rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-gray-700 mr-1">Delivery boys on duty:</span>
        {onDuty.length === 0 && <span className="text-red-600 font-semibold">None - add or switch one on in Delivery Boys</span>}
        {onDuty.map((b) => (
          <span key={b.id} className={`px-2.5 py-1 rounded-full font-semibold ${b.activeOrders === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            🛵 {b.name} · {load(b)}
          </span>
        ))}
        <span className="ml-auto text-green-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {column("✅ Ready - to dispatch", "Food is packed. Check the delivery boy and press Dispatch.", toDispatch, "text-green-700",
          (o) => <DispatchCard key={o.id} o={o} boys={boys} dispatch={dispatch} reload={refresh} />)}
        {column("📨 Dispatched - waiting to accept", "He has 2 minutes to accept. If he does not, it comes back here under Ready with the next delivery boy suggested.", waiting, "text-blue-700",
          (o) => <DispatchCard key={o.id} o={o} boys={boys} dispatch={dispatch} reload={refresh} />)}
        {column("🛵 Out for delivery", "Accepted by the delivery boy - on the way. Only he can mark it delivered.", out, "text-indigo-700", (o) => (
          <article key={o.id} className="bg-white rounded-2xl border-2 border-indigo-200 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <h3 className="font-bold">Order #{o.id}</h3>
              <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-indigo-100 text-indigo-700">Since {fmtTime(o.pickedUpAt || o.deliveryAcceptedAt)}</span>
            </div>
            <p className="mt-1">🛵 <b>{o.deliveryBoyName}</b> {o.deliveryBoyPhone && <a href={`tel:${o.deliveryBoyPhone}`} className="underline text-xs">{o.deliveryBoyPhone}</a>}</p>
            <p className="text-xs text-gray-600">To {o.customerName} · 📍 {o.deliveryAddress}</p>
            <p className={`text-xs font-semibold mt-1 ${o.paymentStatus === "PAID" ? "text-green-700" : "text-amber-700"}`}>
              {o.paymentStatus === "PAID" ? "✔ Paid online" : `💵 Collecting ${inr2(payable(o))}`}
            </p>
          </article>
        ))}
      </div>

      {cooking.length > 0 && (
        <p className="mt-6 text-xs text-gray-500">
          🍳 In the kitchen: {cooking.map((o) => `#${o.id}`).join(", ")} - they appear under “Ready - to dispatch” as soon as the kitchen marks them Ready.
        </p>
      )}
    </div>
  );
}
