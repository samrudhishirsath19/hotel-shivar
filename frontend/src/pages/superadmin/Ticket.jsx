import { inr } from "../../roles";
import { fmtTime, minutesSince } from "../../dates";

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

// One kitchen ticket: items, total, and action buttons passed as children.
export function Ticket({ title, sub, badge, badgeClass = "bg-orange-100 text-orange-700", tone = "border-orange-300", order, children }) {
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
      <div className="mt-3 divide-y">
        {order.lines.map((l) => (
          <div key={l.menuItemId} className="flex justify-between text-sm py-1">
            <span><b>{l.quantity}</b> x {l.name}</span>
            <span className="text-gray-600">{inr(l.unitPrice * l.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="border-t mt-1 pt-2 flex justify-between font-bold text-sm">
        <span>Total</span>
        <span className="text-[#B8893C]">{inr(order.total)}</span>
      </div>
      {children && <div className="flex gap-2 mt-3">{children}</div>}
    </div>
  );
}

// Accept / Bill Paid / Cancel buttons for an order.
export function OrderActions({ order, run, paidLabel = "Bill Paid" }) {
  const pending = order.status === "PENDING";
  const t = orderTitle(order);
  return (
    <>
      {pending ? (
        <button onClick={() => run(order.id, "accept", `✅ ${t} accepted`)} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Accept Order</button>
      ) : (
        <button onClick={() => run(order.id, "paid", `✅ ${t} - bill paid`)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">{paidLabel}</button>
      )}
      <button
        onClick={() => window.confirm(pending ? `Reject ${t}?` : `Cancel ${t}?`) && run(order.id, "cancel", `${t} cancelled`)}
        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold"
      >
        {pending ? "Reject" : "Cancel"}
      </button>
    </>
  );
}
