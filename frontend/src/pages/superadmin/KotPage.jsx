import { useState } from "react";
<<<<<<< Updated upstream
import { Link } from "react-router-dom";
=======
>>>>>>> Stashed changes
import useBoard from "./useBoard";
import { useAuth } from "../../context/AuthContext";
import { canSee } from "../../roles";
import { usePanel } from "./panelContext";
import { PageTitle } from "./ui";
import TakeOrder from "./TakeOrder";
<<<<<<< Updated upstream
import { Ticket, AcceptActions, KitchenActions, Toast, orderTitle, orderKind, isReady } from "./Ticket";

// Kitchen Order Tickets. Shows what is still being made and what is already prepared.
// (Payment is not done here - it is in Billing.)
export default function KotPage() {
  const { board, error, msg, run, reload } = useBoard();
  const [showNew, setShowNew] = useState(false);

  const tables = (board?.tables || []).filter((t) => t.order).map((t) => t.order);
  const rooms = board?.rooms || [];
  const online = board?.online || [];
  const waiting = online.filter((o) => o.status === "PENDING");
  const byAge = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt));
  const kitchen = [...tables, ...rooms, ...online.filter((o) => o.status === "ACCEPTED")].sort(byAge);
  const preparing = kitchen.filter((o) => !isReady(o));
  const ready = kitchen.filter(isReady);

  const sub = (o) => (o.orderType === "ONLINE" ? `${o.customerName} · ${o.customerPhone}` : `KOT #${o.id}`);
  const card = (o) => (
    <Ticket key={o.id} title={orderTitle(o)} sub={sub(o)} badge={orderKind(o)} order={o}>
      <KitchenActions order={o} run={run} />
    </Ticket>
  );

  return (
    <div>
      <Toast msg={msg} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="KOT" sub="Kitchen order tickets - refreshes every few seconds" />
        <button onClick={() => setShowNew((s) => !s)} className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">
          {showNew ? "Close new order" : "＋ New order"}
        </button>
      </div>

      {showNew && <TakeOrder onClose={() => setShowNew(false)} onChanged={reload} />}
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      {waiting.length > 0 && (
        <>
          <h2 className="mb-3 font-bold text-gray-900">New online orders - waiting to be accepted ({waiting.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {waiting.map((o) => (
              <Ticket key={o.id} title={orderTitle(o)} sub={`${o.customerName} · ${o.customerPhone}`} badge="NEW"
                badgeClass="bg-yellow-100 text-yellow-800" order={o}>
                <AcceptActions order={o} run={run} />
              </Ticket>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 font-bold text-orange-700">🍳 Being prepared ({preparing.length})</h2>
      {board && preparing.length === 0 && <p className="text-sm text-gray-400 mb-6">Nothing is being prepared right now.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">{preparing.map(card)}</div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-bold text-green-700">✅ Ready ({ready.length})</h2>
        {ready.length > 0 && <Link to="/super-admin/billing" className="text-sm font-semibold text-[#B8893C]">Go to Billing to take payment →</Link>}
      </div>
      {board && ready.length === 0 && <p className="text-sm text-gray-400">No prepared orders waiting.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{ready.map(card)}</div>
=======
import OrdersBoard from "./OrdersBoard";

// Kitchen Order Tickets: new orders -> Ready for Serving/Shipping -> sent to Billing.
// (Payment is not done here - it is in Billing.)
export default function KotPage() {
  const boardState = useBoard();
  const [showNew, setShowNew] = useState(false);
  const { user } = useAuth();
  const { base } = usePanel();
  const role = user?.role;
  const kitchen = ["SUPER_ADMIN", "MANAGER", "KITCHEN"].includes(role);    // may mark orders ready
  const captain = ["SUPER_ADMIN", "MANAGER", "RESTAURANT"].includes(role); // may take orders, send to billing, cancel

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="KOT"
          sub={role === "KITCHEN"
            ? "New orders appear here automatically. Press Mark Ready when an order is made."
            : "Kitchen order tickets - refreshes every few seconds"}
        />
        {captain && (
          <button onClick={() => setShowNew((s) => !s)} className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">
            {showNew ? "Close new order" : "＋ New order"}
          </button>
        )}
      </div>

      {captain && showNew && <TakeOrder allowOnline={role === "SUPER_ADMIN"} onClose={() => setShowNew(false)} onChanged={boardState.reload} />}
      <OrdersBoard
        boardState={boardState}
        kitchen={kitchen}
        captain={captain}
        showBilled={role !== "KITCHEN"}
        billingPath={canSee(role, "billing") ? `${base}/billing` : undefined}
      />
>>>>>>> Stashed changes
    </div>
  );
}
