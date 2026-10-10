import { inr } from "../../roles";
import { fmtTime, minutesSince } from "../../dates";
<<<<<<< HEAD
import { taxOf, inr2, pct } from "../../gst";
import { PAYMENT_STATUS, methodLabel, canConfirm, onlineLabel, onlineStatusOf } from "../../orderStatus";
=======
>>>>>>> origin/sakshi

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#1F3B2D] text-white px-6 py-3 rounded-full shadow-lg font-bold z-[9999] text-sm text-center">
      {msg}
    </div>
  );
}

export const orderTitle = (o) =>
  o.orderType === "TABLE" ? `Table ${o.tableNumber}` : o.orderType === "ROOM" ? `Room ${o.roomNumber}` : `Online #${o.id}`;

export const orderKind = (o) =>
  o.orderType === "TABLE" ? "TABLE" : o.orderType === "ROOM" ? "ROOM SERVICE" : "ONLINE";

<<<<<<< HEAD
=======
<<<<<<< Updated upstream
// Orders saved before the kitchen column existed have no value - treat them as "preparing".
export const isReady = (o) => o.kitchenStatus === "READY";
=======
>>>>>>> origin/sakshi
// Kitchen / service progress of a running order:
//   PREPARING -> READY ("Ready to Serve") -> SENT_TO_BILLING ("Ready to Billing") -> paid in Billing.
// Orders saved before the kitchen column existed have no value - treat them as "preparing".
export const isReady = (o) => o.kitchenStatus === "READY";
export const isInBilling = (o) => o.kitchenStatus === "SENT_TO_BILLING";
export const isPreparing = (o) => !isReady(o) && !isInBilling(o);
export const READY_LABEL = "Ready to Serve / Ship"; // heading of the whole group
// what one ready order says: table and room orders are served, online orders are shipped
export const readyLabel = (o) => (o.orderType === "ONLINE" ? "Ready to Ship" : "Ready to Serve");

const STAGE = {
  PREPARING: { text: () => "🍳 Preparing...", cls: "bg-orange-50 text-orange-700", border: "border-orange-300" },
  READY: { text: (o) => "✅ " + readyLabel(o), cls: "bg-green-50 text-green-700", border: "border-green-300" },
  SENT_TO_BILLING: { text: () => "🧾 Sent to Billing", cls: "bg-blue-50 text-blue-700", border: "border-blue-300" },
};
const stageOf = (o) => STAGE[isReady(o) ? "READY" : isInBilling(o) ? "SENT_TO_BILLING" : "PREPARING"];
<<<<<<< HEAD

// Payment status pill: Payment Pending / Paid / Failed / Refunded (+ method)
export function PaymentBadge({ order, withMethod = true }) {
  if (!order.paymentStatus) return null;
  const s = PAYMENT_STATUS[order.paymentStatus] || { label: order.paymentStatus, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${s.cls}`}>
      {s.label}{withMethod && order.paymentMethod ? ` · ${methodLabel(order.paymentMethod)}` : ""}
    </span>
  );
}

// Subtotal, GST (CGST + SGST) and the amount to pay - the GST stored on the order, never added again.
export function BillTotals({ order }) {
  const t = taxOf(order, "total");
  if (!t || t.tax === 0) {
    return (
      <div className="border-t mt-1 pt-2 flex justify-between font-bold text-sm">
        <span>Total</span>
        <span className="text-[#B8893C]">{inr2(t ? t.total : order.total)}</span>
      </div>
    );
  }
  return (
    <div className="border-t mt-1 pt-2 text-sm">
      <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{inr2(t.taxable)}</span></div>
      <div className="flex justify-between text-gray-500 text-xs"><span>CGST {pct(t.rate / 2)} + SGST {pct(t.rate / 2)}</span><span>{inr2(t.tax)}</span></div>
      <div className="flex justify-between font-bold mt-1"><span>Total (incl. GST)</span><span className="text-[#B8893C]">{inr2(t.total)}</span></div>
    </div>
  );
}
=======
>>>>>>> Stashed changes
>>>>>>> origin/sakshi

// One ticket: items, total, kitchen progress and action buttons (children).
export function Ticket({ title, sub, badge, badgeClass = "bg-orange-100 text-orange-700", order, showKitchen = true, children }) {
  const kitchen = showKitchen && order.status !== "PENDING";
<<<<<<< HEAD
  const stage = stageOf(order);
  const tone = !kitchen ? "border-yellow-300" : stage.border;
=======
<<<<<<< Updated upstream
  const ready = isReady(order);
  const tone = !kitchen ? "border-yellow-300" : ready ? "border-green-300" : "border-orange-300";
=======
  const stage = stageOf(order);
  const tone = !kitchen ? "border-yellow-300" : stage.border;
>>>>>>> Stashed changes
>>>>>>> origin/sakshi
  return (
    <div className={`bg-white rounded-xl border-2 p-4 ${tone}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          {sub && <p className="text-xs text-gray-500">{sub}</p>}
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${badgeClass}`}>{badge}</span>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">
        Ordered {fmtTime(order.createdAt)} · {minutesSince(order.createdAt)} min ago
      </p>
<<<<<<< HEAD
      {order.orderType === "ONLINE" && (order.deliveryAddress || order.paymentStatus) && (
        <div className="mt-2 space-y-1.5">
          {order.deliveryAddress && <p className="text-xs text-gray-600">📍 {order.deliveryAddress}</p>}
          <div className="flex flex-wrap gap-1.5">
            <PaymentBadge order={order} />
            {order.onlineStatus && <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-gray-100 text-gray-700">{onlineLabel(onlineStatusOf(order))}</span>}
          </div>
        </div>
      )}

      {kitchen && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-bold ${stage.cls}`}>{stage.text(order)}</div>
=======

      {kitchen && (
<<<<<<< Updated upstream
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-bold ${ready ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
          {ready ? "✅ Ready - prepared" : "🍳 Preparing..."}
        </div>
=======
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-bold ${stage.cls}`}>{stage.text(order)}</div>
>>>>>>> Stashed changes
>>>>>>> origin/sakshi
      )}

      <div className="mt-3 divide-y">
        {order.lines.map((l) => (
          <div key={l.menuItemId} className="flex justify-between text-sm py-1">
            <span><b>{l.quantity}</b> x {l.name}</span>
            <span className="text-gray-600">{inr(l.unitPrice * l.quantity)}</span>
          </div>
        ))}
      </div>
<<<<<<< HEAD
      <BillTotals order={order} />
=======
      <div className="border-t mt-1 pt-2 flex justify-between font-bold text-sm">
        <span>Total</span>
        <span className="text-[#B8893C]">{inr(order.total)}</span>
      </div>
>>>>>>> origin/sakshi
      {children && <div className="flex gap-2 mt-3">{children}</div>}
    </div>
  );
}

// New online order: Accept / Reject
<<<<<<< HEAD
export function AcceptActions({ order, run, accept = true, cancel = true }) {
  const t = orderTitle(order);
  return (
    <>
      {!accept ? null : canConfirm(order) ? (
        <button onClick={() => run(order.id, "accept", `✅ ${t} confirmed - sent to kitchen`)} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Accept Order</button>
      ) : (
        <span className="flex-1 py-2 text-center bg-yellow-50 text-yellow-800 rounded-lg text-xs font-bold" title="An online order can be confirmed after it is paid (or when it is cash on delivery)">
          Waiting for payment
        </span>
      )}
      {cancel && <button onClick={() => window.confirm(`Reject ${t}?`) && run(order.id, "cancel", `${t} rejected`)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Reject</button>}
=======
export function AcceptActions({ order, run }) {
  const t = orderTitle(order);
  return (
    <>
      <button onClick={() => run(order.id, "accept", `✅ ${t} accepted - sent to kitchen`)} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Accept Order</button>
      <button onClick={() => window.confirm(`Reject ${t}?`) && run(order.id, "cancel", `${t} rejected`)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Reject</button>
>>>>>>> origin/sakshi
    </>
  );
}

<<<<<<< HEAD
=======
<<<<<<< Updated upstream
// Order in the kitchen: Mark ready / Back to preparing, and Cancel. (Payment is done in Billing.)
export function KitchenActions({ order, run }) {
  const t = orderTitle(order);
  const ready = isReady(order);
  return (
    <>
      {ready ? (
        <button onClick={() => run(order.id, "preparing", `${t} is being prepared again`)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Back to Preparing</button>
      ) : (
        <button onClick={() => run(order.id, "ready", `✅ ${t} is ready`)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">Mark Ready</button>
=======
>>>>>>> origin/sakshi
// Kitchen: a new order is marked ready. Once ready it cannot go back to preparing.
export function KitchenActions({ order, run }) {
  const t = orderTitle(order);
  if (!isPreparing(order)) return null;
  return (
    <button onClick={() => run(order.id, "ready", `✅ ${t} is ${readyLabel(order)}`)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">
      Mark Ready
    </button>
  );
}

// Captain: the order shows "Ready to Serve" only after the kitchen has marked it ready. When the meal is finished
// the captain presses "Ready to Billing" and the order goes to Billing. Cancel while not billed.
<<<<<<< HEAD
export function CaptainActions({ order, run, sendToBilling = true, cancel = true }) {
=======
export function CaptainActions({ order, run }) {
>>>>>>> origin/sakshi
  const t = orderTitle(order);
  if (isInBilling(order)) return null;
  return (
    <>
<<<<<<< HEAD
      {isReady(order) && order.orderType === "ONLINE" && order.onlineStatus && (
        <span className="flex-1 py-2 text-center bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">🛵 Dispatch from Online Orders</span>
      )}
      {sendToBilling && isReady(order) && !(order.orderType === "ONLINE" && order.onlineStatus) && (
        <button onClick={() => run(order.id, "send-to-billing", `🧾 ${t} sent to Billing`)} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">
          Ready to Billing
        </button>
      )}
      {cancel && <button onClick={() => window.confirm(`Cancel ${t}?`) && run(order.id, "cancel", `${t} cancelled`)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>}
=======
      {isReady(order) && (
        <button onClick={() => run(order.id, "send-to-billing", `🧾 ${t} sent to Billing`)} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">
          Ready to Billing
        </button>
>>>>>>> Stashed changes
      )}
      <button onClick={() => window.confirm(`Cancel ${t}?`) && run(order.id, "cancel", `${t} cancelled`)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
>>>>>>> origin/sakshi
    </>
  );
}
