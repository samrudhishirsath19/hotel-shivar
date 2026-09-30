import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { inr, can } from "../../roles";
import { fmtDateTime, fmtTime, minutesSince } from "../../dates";
import { NEXT_STEP, PAYMENT_STATUS, methodLabel, onlineStatusOf, onlineLabel, canConfirm } from "../../orderStatus";
import { printBill } from "../../printBill";
import { taxOf, payable, inr2, pct } from "../../gst";
import OrderStepper from "../../components/OrderStepper";
import { PageTitle } from "./ui";
import { Toast, PaymentBadge } from "./Ticket";

const FILTERS = [
  { id: "active", label: "Active", match: (s) => !["DELIVERED", "CANCELLED"].includes(s) },
  { id: "new", label: "New", match: (s) => s === "PLACED" },
  { id: "kitchen", label: "In kitchen", match: (s) => s === "CONFIRMED" || s === "PREPARING" },
  { id: "ready", label: "Ready", match: (s) => s === "READY" },
  { id: "out", label: "Out for delivery", match: (s) => s === "OUT_FOR_DELIVERY" },
  { id: "delivered", label: "Delivered", match: (s) => s === "DELIVERED" },
  { id: "cancelled", label: "Cancelled", match: (s) => s === "CANCELLED" },
  { id: "all", label: "All", match: () => true },
];

// Payment attempts and refunds of one order
function PaymentHistory({ orderId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetch(`/api/admin/online-orders/${orderId}`).then(setData).catch((e) => setError(e.message));
  }, [orderId]);
  if (error) return <p className="text-xs text-red-600 mt-2">{error}</p>;
  if (!data) return <p className="text-xs text-gray-400 mt-2">Loading payments...</p>;
  if (data.payments.length === 0) return <p className="text-xs text-gray-400 mt-2">No payment attempts yet.</p>;
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-[11px] min-w-[480px] [&_td]:pr-2 [&_th]:pr-2">
        <thead className="text-left text-gray-500"><tr><th className="py-1">Time</th><th>Type</th><th>Method</th><th>Result</th><th>Payment ID</th><th>Txn ref</th><th className="text-right">Amount</th></tr></thead>
        <tbody>
          {data.payments.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-1 whitespace-nowrap">{fmtTime(p.createdAt)}</td>
              <td>{p.kind === "REFUND" ? "Refund" : "Payment"}</td>
              <td>{methodLabel(p.method)}{p.payerDetail ? ` (${p.payerDetail})` : ""}</td>
              <td className={p.result === "SUCCESS" ? "text-green-700 font-bold" : "text-red-600 font-bold"}>{p.result === "SUCCESS" ? "Success" : "Failed"}</td>
              <td className="font-mono">{p.paymentId}</td>
              <td className="font-mono">{p.transactionRef || "-"}</td>
              <td className="text-right">{inr(p.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderCard({ o, canEdit, canCancelOrders, act }) {
  const [showPay, setShowPay] = useState(false);
  const status = onlineStatusOf(o);
  const next = NEXT_STEP[status];
  const blocked = status === "PLACED" && !canConfirm(o);
  const canCancel = canCancelOrders && !["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(status);
  const itemCount = o.lines.reduce((s, l) => s + l.quantity, 0);
  const tone = status === "PLACED" ? "border-yellow-300" : status === "DELIVERED" ? "border-green-300" : status === "CANCELLED" ? "border-gray-200 opacity-80" : "border-orange-300";

  return (
    <article className={`bg-white rounded-2xl border-2 ${tone} overflow-hidden flex flex-col`}>
      {/* header */}
      <div className="px-4 pt-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900">Order #{o.id}</h3>
          <p className="text-[11px] text-gray-500">{fmtDateTime(o.createdAt)}{!["DELIVERED", "CANCELLED"].includes(status) && ` · ${minutesSince(o.createdAt)} min ago`}</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-[#1F3B2D] text-white whitespace-nowrap">{onlineLabel(status)}</span>
      </div>


      <div className="px-4 mt-3"><OrderStepper status={status} compact /></div>

      {/* customer */}
      <div className="mx-4 mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm">
        <p className="font-semibold text-gray-900">👤 {o.customerName}</p>
        <p className="text-xs text-gray-600 mt-0.5">📞 <a href={`tel:${o.customerPhone}`} className="underline">{o.customerPhone}</a></p>
        <p className="text-xs text-gray-600 mt-0.5">📍 {o.deliveryAddress || <span className="italic text-gray-400">No address (older order)</span>}</p>
        {o.deliveryNote && <p className="text-xs text-gray-500 mt-0.5">📝 {o.deliveryNote}</p>}
      </div>

      {/* items */}
      <div className="px-4 mt-3">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-gray-500 text-left"><tr><th className="font-medium pb-1">Item</th><th className="font-medium pb-1 text-center">Qty</th><th className="font-medium pb-1 text-right">Price</th><th className="font-medium pb-1 text-right">Amount</th></tr></thead>
          <tbody>
            {o.lines.map((l) => (
              <tr key={l.menuItemId} className="border-t">
                <td className="py-1 pr-2">{l.name}</td>
                <td className="py-1 text-center">{l.quantity}</td>
                <td className="py-1 text-right text-gray-600">{inr(l.unitPrice)}</td>
                <td className="py-1 text-right">{inr(l.unitPrice * l.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {taxOf(o) && taxOf(o).tax > 0 && (
              <>
                <tr className="border-t text-gray-600">
                  <td className="pt-1.5" colSpan="3">Item total ({itemCount} item{itemCount > 1 ? "s" : ""})</td>
                  <td className="pt-1.5 text-right">{inr2(o.total)}</td>
                </tr>
                <tr className="text-xs text-gray-500">
                  <td colSpan="3">GST {pct(o.gstRate)} (CGST {inr2(o.cgstAmount)} + SGST {inr2(o.sgstAmount)})</td>
                  <td className="text-right">{inr2(o.taxAmount)}</td>
                </tr>
              </>
            )}
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="pt-1.5" colSpan="3">{taxOf(o) ? "Total (incl. GST)" : `Total (${itemCount} item${itemCount > 1 ? "s" : ""})`}</td>
              <td className="pt-1.5 text-right text-[#B8893C]">{inr2(payable(o))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* payment */}
      <div className="mx-4 mt-3 rounded-xl border px-3 py-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-700">💳 Payment</span>
          {o.paymentStatus ? <PaymentBadge order={o} withMethod={false} /> : <span className="text-gray-400">Not recorded</span>}
        </div>
        {o.paymentStatus && (
          <div className="mt-1 grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5 text-gray-600">
            <span>Method</span><span className="font-medium">{methodLabel(o.paymentMethod)}</span>
            {o.paymentId && <><span>Payment ID</span><span className="font-mono break-all">{o.paymentId}</span></>}
            {o.paymentRef && <><span>Txn ref</span><span className="font-mono break-all">{o.paymentRef}</span></>}
          </div>
        )}
        <button onClick={() => setShowPay((s) => !s)} className="mt-1 text-[11px] font-semibold text-[#B8893C]">
          {showPay ? "Hide transactions ▲" : "Transaction details ▼"}
        </button>
        {showPay && <PaymentHistory orderId={o.id} />}
      </div>

      {/* actions */}
      <div className="p-4 mt-auto flex flex-wrap gap-2">
        {canEdit && next && (
          blocked ? (
            <span className="flex-1 text-center py-2 rounded-lg bg-yellow-50 text-yellow-800 text-xs font-bold" title="Confirm after the customer pays, or when it is cash on delivery">
              {o.paymentStatus === "FAILED" ? "Payment failed - waiting for retry" : "Waiting for payment"}
            </span>
          ) : (
            <button onClick={() => act(o, next.to, next.label)} className="flex-1 py-2 rounded-lg bg-[#1F3B2D] text-white text-xs font-bold">
              {next.label} →
            </button>
          )
        )}
        <button onClick={() => printBill(o)} className="px-3 py-2 rounded-lg bg-gray-100 text-xs font-bold">🖨️ Bill</button>
        {canCancel && (
          <button
            onClick={() => window.confirm(`Cancel order #${o.id}?${o.paymentStatus === "PAID" ? " The payment will be refunded." : ""}`) && act(o, "CANCELLED", "Cancel")}
            className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold"
          >
            Cancel{o.paymentStatus === "PAID" ? " & refund" : ""}
          </button>
        )}
      </div>
    </article>
  );
}

// Online (delivery) orders, Swiggy / Zomato style: customer, address, items, payment and delivery progress.
export default function OnlineOrdersPage() {
  const { user, logout } = useAuth();
  const canEdit = can(user?.role, "ONLINE_MANAGE");    // confirm / next delivery step
  const canCancel = can(user?.role, "ORDER_CANCEL");
  const [orders, setOrders] = useState(null);
  const [days, setDays] = useState(1);
  const [filter, setFilter] = useState("active");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3500); };

  const load = useCallback(async () => {
    try {
      setOrders(await apiFetch(`/api/admin/online-orders?days=${days}`));
      setError("");
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [days, logout]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (o, to, label) => {
    try {
      await apiFetch(`/api/admin/online-orders/${o.id}/status?to=${to}`, { method: "POST" });
      flash(to === "CANCELLED" ? `Order #${o.id} cancelled${o.paymentStatus === "PAID" ? " - payment refunded" : ""}` : `✅ Order #${o.id}: ${label.replace(/ →$/, "")}`);
      load();
    } catch (e) {
      flash("⚠️ " + e.message);
    }
  };

  const list = orders || [];
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, list.filter((o) => f.match(onlineStatusOf(o))).length]));
  const shown = list.filter((o) => FILTERS.find((f) => f.id === filter).match(onlineStatusOf(o)));
  const todayPaid = list.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + payable(o), 0);

  return (
    <div>
      <Toast msg={msg} />
      <PageTitle title="Online Orders" sub="Delivery orders: Placed → Confirmed → Preparing → Ready → Out for Delivery → Delivered" />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          ["New orders", counts.new, "text-yellow-700"],
          ["In kitchen / ready", counts.kitchen + counts.ready, "text-orange-600"],
          ["Out for delivery", counts.out, "text-blue-600"],
          ["Paid (shown period)", inr(todayPaid), "text-green-600"],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{orders ? value : "-"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${filter === f.id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white text-gray-700"}`}>
              {f.label} <span className="opacity-70">({counts[f.id]})</span>
            </button>
          ))}
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border rounded-lg px-3 py-1.5 text-sm bg-white" aria-label="Period">
          <option value={0}>Today</option>
          <option value={1}>Today and yesterday</option>
          <option value={6}>Last 7 days</option>
          <option value={29}>Last 30 days</option>
        </select>
      </div>

      {!canEdit && <p className="mb-3 text-xs text-gray-500">View only - the captain / manager moves orders to the next step. The kitchen marks them ready from KOT.</p>}
      {orders && shown.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No orders here.</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {shown.map((o) => <OrderCard key={o.id} o={o} canEdit={canEdit} canCancelOrders={canCancel} act={act} />)}
      </div>
      <p className="mt-6 text-xs text-gray-400">
        {Object.values(PAYMENT_STATUS).map((v) => v.label).join(" · ")} — an order can be confirmed only after it is paid, or when the customer chose cash on delivery. Cancelling a paid order refunds it.
      </p>
    </div>
  );
}
