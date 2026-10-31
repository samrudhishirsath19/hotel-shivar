import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { onlineStatusOf, onlineLabel, methodLabel } from "../../orderStatus";
import { fmtDateTime } from "../../dates";
import { payable, inr2 } from "../../gst";
import { deliveryStage, mapsLink } from "../../delivery";
import { Toast } from "./Ticket";
import AcceptCountdown from "../../components/AcceptCountdown";

const cashToCollect = (o) => o.paymentStatus !== "PAID";

// short double beep for a new order (browsers allow it after the page has been clicked once)
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch { /* sound not available */ }
}

// One assigned order with the next thing to do, as big buttons (easy to use on a phone).
function DeliveryCard({ o, act, offsetMs, total, reload }) {
  const st = onlineStatusOf(o);
  const stage = deliveryStage(o);
  const items = o.lines.reduce((s, l) => s + l.quantity, 0);
  const done = st === "DELIVERED" || st === "CANCELLED";

  const decline = (
    <button onClick={() => window.confirm(`Hand order #${o.id} back? It will go to another delivery boy.`) && act(o, "decline", "Handed back to another delivery boy")}
      className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm">Decline</button>
  );
  let main = null;
  if (st === "READY" && !o.dispatchedAt) {
    main = (
      <div className="flex gap-2">
        <p className="flex-1 text-center text-sm font-semibold text-orange-700 bg-orange-50 rounded-xl py-3">📦 Suggested for you - waiting for the Order User to send it</p>
        {decline}
      </div>
    );
  } else if (st === "READY") {
    // accepting = taking the food: the order goes Out for delivery straight away
    main = (
      <>
      {o.acceptBy && <div className="mb-2"><AcceptCountdown until={o.acceptBy} offsetMs={offsetMs} total={total} onExpire={reload} /></div>}
      <div className="flex gap-2">
        <button onClick={() => act(o, "accept", "Accepted - Out for delivery")} className="flex-1 py-3 rounded-xl bg-[#1F3B2D] text-white font-bold">
          ✅ Accept Order
          <span className="block text-[11px] font-normal text-white/80">starts the delivery (Out for Delivery)</span>
        </button>
        {decline}
      </div>
      </>
    );
  } else if (st === "OUT_FOR_DELIVERY") {
    main = (
      <button onClick={() => window.confirm(cashToCollect(o) ? `Collected ${inr2(payable(o))} cash and delivered order #${o.id}?` : `Delivered order #${o.id}?`) && act(o, "deliver", "Delivered")}
        className="w-full py-3 rounded-xl bg-green-600 text-white font-bold">
        🏠 Mark delivered{cashToCollect(o) ? ` (collect ${inr2(payable(o))})` : ""}
      </button>
    );
  } else if (!done) {
    main = (
      <div className="flex gap-2">
        <p className="flex-1 text-center text-sm font-semibold text-orange-700 bg-orange-50 rounded-xl py-3">🍳 Kitchen is preparing - you can accept once it is Ready</p>
        {decline}
      </div>
    );
  }

  return (
    <article className={`bg-white rounded-2xl border-2 p-4 ${done ? "border-gray-200 opacity-80" : stage.id === "waiting" ? "border-yellow-400 shadow-lg shadow-yellow-100" : "border-[#1F3B2D]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Order #{o.id}</h3>
          <p className="text-xs text-gray-500">{fmtDateTime(o.createdAt)} · {items} item{items === 1 ? "" : "s"}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#1F3B2D] text-white whitespace-nowrap">{onlineLabel(st)}</span>
      </div>

      <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm space-y-1">
        <p className="font-semibold">👤 {o.customerName}</p>
        <p>📞 <a href={`tel:${o.customerPhone}`} className="underline font-semibold">{o.customerPhone}</a></p>
        <p>📍 {o.deliveryAddress} <a href={mapsLink(o.deliveryAddress)} target="_blank" rel="noreferrer" className="ml-1 text-[#B8893C] font-semibold whitespace-nowrap">Open map ↗</a></p>
        {o.deliveryNote && <p className="text-gray-600">📝 {o.deliveryNote}</p>}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-600">{o.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")}</span>
      </div>
      <div className={`mt-2 rounded-xl px-3 py-2 text-sm font-semibold ${cashToCollect(o) && !done ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-green-50 text-green-800"}`}>
        {o.paymentStatus === "PAID" ? `✔ Paid online (${methodLabel(o.paymentMethod)}) - collect nothing` : `💵 Collect cash: ${inr2(payable(o))}`}
      </div>

      {main && <div className="mt-3">{main}</div>}
      <p className="mt-2 text-[11px] text-gray-400">
        {o.dispatchedAt ? `Dispatched by ${o.dispatchedBy || "the Order User"} at ${fmtDateTime(o.dispatchedAt)}`
          : `${o.deliveryAssignedBy === "Auto-assigned" ? "Assigned to you automatically" : `Assigned by ${o.deliveryAssignedBy || "the Order User"}`}${o.deliveryAssignedAt ? ` at ${fmtDateTime(o.deliveryAssignedAt)}` : ""}`}
      </p>
    </article>
  );
}

// Delivery boy's screen: only the orders assigned to him.
export default function DeliveriesPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [offsetMs, setOffsetMs] = useState(0); // server clock - this phone's clock (for the countdown)
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("pending");
  const [alert, setAlert] = useState("");
  const seen = useRef(null); // ids of orders sent to me and not accepted yet, to notice new ones
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3500); };

  const load = useCallback(async () => {
    try {
      const d = await apiFetch("/api/delivery/orders");
      // orders the Order User has sent to me (assigned / dispatched) that I have not accepted yet
      const sent = (d.orders || []).filter((o) => o.dispatchedAt && !o.deliveryAcceptedAt && onlineStatusOf(o) !== "CANCELLED");
      const waiting = sent.map((o) => o.id);
      if (seen.current) {
        const fresh = sent.filter((o) => !seen.current.includes(o.id));
        if (fresh.length) {
          const ready = fresh.filter((o) => onlineStatusOf(o) === "READY");
          setAlert(ready.length
            ? `🔔 New order ${ready.map((o) => "#" + o.id).join(", ")} assigned to you - tap Accept Order to start the delivery`
            : `🔔 New order ${fresh.map((o) => "#" + o.id).join(", ")} assigned to you - the kitchen is still preparing it`);
          setTab("pending");
          beep();
        }
      }
      seen.current = waiting;
      if (d.serverTime) setOffsetMs(new Date(d.serverTime).getTime() - Date.now());
      setData(d);
      setError("");
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [logout]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 5000); // live
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [load]);

  const act = async (o, action, okText) => {
    try {
      await apiFetch(`/api/delivery/orders/${o.id}/${action}`, { method: "POST" });
      flash(`✅ Order #${o.id}: ${okText}`);
      load();
    } catch (e) {
      flash("⚠️ " + e.message);
      load();
    }
  };

  const orders = data?.orders || [];
  const active = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(onlineStatusOf(o)));
  // Pending Orders: given to me, not accepted yet - ones I can accept now (sent to me + food Ready) first
  const rank = (o) => (o.dispatchedAt && onlineStatusOf(o) === "READY" ? 0 : o.dispatchedAt ? 1 : 2);
  const pending = active.filter((o) => onlineStatusOf(o) !== "OUT_FOR_DELIVERY")
    .sort((a, b) => rank(a) - rank(b) || String(a.createdAt).localeCompare(String(b.createdAt)));
  const onTheWay = active.filter((o) => onlineStatusOf(o) === "OUT_FOR_DELIVERY");
  const done = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(onlineStatusOf(o)));
  const cash = onTheWay.filter(cashToCollect).reduce((s, o) => s + payable(o), 0);
  const shown = tab === "pending" ? pending : tab === "way" ? onTheWay : done;

  return (
    <div className="max-w-3xl">
      <Toast msg={msg} />
      <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
      <p className="text-sm text-gray-500 mb-4">Hi {user?.name?.split(" ")[0]} - orders the Order User assigns to you appear under Pending Orders. Tap Accept Order within 2 minutes to start the delivery (it goes Out for Delivery) - otherwise it goes to another delivery boy. Only you can handle your orders.</p>
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}
      {alert && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 bg-yellow-50 border-2 border-yellow-400 text-yellow-900 text-sm font-semibold px-4 py-3 rounded-xl">
          <span>{alert}</span>
          <button onClick={() => { setAlert(""); setTab("pending"); }} className="text-xs underline shrink-0">OK</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          ["Pending - to accept", data?.toAccept ?? "-", "text-yellow-700"],
          ["On the way", onTheWay.length, "text-blue-700"],
          ["Delivered today", data?.deliveredToday ?? "-", "text-green-700"],
          ["Cash to collect", inr2(cash), "text-amber-700"],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[["pending", `Pending Orders (${pending.length})`], ["way", `On the way (${onTheWay.length})`], ["done", `Done today (${done.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${tab === id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white"}`}>{label}</button>
        ))}
        <span className="ml-auto text-xs text-green-700 self-center flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live</span>
      </div>

      {data && shown.length === 0 && (
        <p className="bg-white rounded-2xl border p-8 text-center text-sm text-gray-500">
          {tab === "pending" ? "No pending orders. When the Order User assigns an order to you it appears here straight away with an Accept Order button."
            : tab === "way" ? "Nothing on the way. Accept a pending order to start a delivery." : "Nothing delivered yet today."}
        </p>
      )}
      <div className="space-y-3">
        {shown.map((o) => <DeliveryCard key={o.id} o={o} act={act} offsetMs={offsetMs} total={data?.acceptSeconds || 120} reload={load} />)}
      </div>
    </div>
  );
}
