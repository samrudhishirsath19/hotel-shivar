import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ticket, AcceptActions, KitchenActions, CaptainActions, Toast,
  orderTitle, orderKind, isReady, isInBilling, isPreparing, READY_LABEL,
} from "./Ticket";

// The live KOT board, shared by the super admin, manager, captain and kitchen screens.
//   kitchen  - may mark new orders Ready
//   captain  - may accept online orders, send ready orders to Billing and cancel
//   billingPath - where the "go to billing" link points (omit to hide it)
export default function OrdersBoard({ boardState, kitchen = false, captain = false, billingPath, showBilled = true }) {
  const { board, error, msg, run } = boardState;
  const [newCount, setNewCount] = useState(0);
  const seen = useRef(null);

  const tables = (board?.tables || []).filter((t) => t.order).map((t) => t.order);
  const rooms = board?.rooms || [];
  const online = board?.online || [];
  const waiting = online.filter((o) => o.status === "PENDING");
  const byAge = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt));
  const running = [...tables, ...rooms, ...online.filter((o) => o.status === "ACCEPTED")].sort(byAge);
  const preparing = running.filter(isPreparing);
  const ready = running.filter(isReady);
  const billed = running.filter(isInBilling);

  // kitchen: point out orders that arrived since the last refresh
  const prepKey = preparing.map((o) => `${o.id}:${o.lines.reduce((s, l) => s + l.quantity, 0)}`).join(",");
  useEffect(() => {
    if (!board) return;
    const now = new Set(prepKey ? prepKey.split(",") : []);
    if (seen.current) {
      const fresh = [...now].filter((k) => !seen.current.has(k)).length;
      if (fresh > 0) setNewCount((c) => c + fresh);
    }
    seen.current = now;
  }, [board, prepKey]);

  const sub = (o) => (o.orderType === "ONLINE" ? `${o.customerName} · ${o.customerPhone}` : `KOT #${o.id}`);
  const card = (o) => {
    const kitchenBtn = kitchen && isPreparing(o);
    const captainBtn = captain && !isInBilling(o);
    return (
      <Ticket key={o.id} title={orderTitle(o)} sub={sub(o)} badge={orderKind(o)} order={o}>
        {(kitchenBtn || captainBtn) && (
          <>
            {kitchenBtn && <KitchenActions order={o} run={run} />}
            {captainBtn && <CaptainActions order={o} run={run} />}
          </>
        )}
      </Ticket>
    );
  };
  const grid = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4";

  return (
    <div>
      <Toast msg={msg} />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      {kitchen && newCount > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-yellow-50 border border-yellow-300 text-yellow-900 text-sm px-4 py-3 rounded-lg">
          <span className="font-bold">🔔 {newCount} new order update{newCount > 1 ? "s" : ""} for the kitchen</span>
          <button onClick={() => setNewCount(0)} className="text-xs font-bold underline">Got it</button>
        </div>
      )}

      {captain && waiting.length > 0 && (
        <>
          <h2 className="mb-3 font-bold text-gray-900">New online orders - waiting to be accepted ({waiting.length})</h2>
          <div className={grid + " mb-8"}>
            {waiting.map((o) => (
              <Ticket key={o.id} title={orderTitle(o)} sub={`${o.customerName} · ${o.customerPhone}`} badge="NEW"
                badgeClass="bg-yellow-100 text-yellow-800" order={o}>
                <AcceptActions order={o} run={run} />
              </Ticket>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 font-bold text-orange-700">🍳 {kitchen ? "New orders - to prepare" : "Being prepared"} ({preparing.length})</h2>
      {board && preparing.length === 0 && <p className="text-sm text-gray-400 mb-6">Nothing is being prepared right now.</p>}
      <div className={grid + " mb-8"}>{preparing.map(card)}</div>

      <h2 className="mb-1 font-bold text-green-700">✅ {READY_LABEL} ({ready.length})</h2>
      <p className="text-xs text-gray-500 mb-3">
        {captain ? "Serve these. When the meal is finished, press “Ready to Billing” - the order then goes to Billing." : "Made by the kitchen - waiting for the captain to serve / ship."}
      </p>
      {board && ready.length === 0 && <p className="text-sm text-gray-400 mb-6">No orders waiting to be served.</p>}
      <div className={grid + " mb-8"}>{ready.map(card)}</div>

      {showBilled && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-bold text-blue-700">🧾 Ready to Billing - awaiting payment ({billed.length})</h2>
            {billingPath && billed.length > 0 && <Link to={billingPath} className="text-sm font-semibold text-[#B8893C]">Go to Billing →</Link>}
          </div>
          {board && billed.length === 0 && <p className="text-sm text-gray-400">No orders waiting for payment.</p>}
          <div className={grid}>{billed.map(card)}</div>
        </>
      )}
    </div>
  );
}
