import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
<<<<<<< Updated upstream
import { apiFetch } from "../api";
import OrderDesk from "../components/OrderDesk";
import { roleLabel, isSuper, canSeeOrders, canEditOrders, canSeeBookings, inr } from "../roles";
=======
import OrderDesk from "../components/OrderDesk";
import { roleLabel, isSuper } from "../roles";
import useBoard from "./superadmin/useBoard";
import OrdersBoard from "./superadmin/OrdersBoard";
import BillingPage from "./superadmin/BillingPage";
import StockOverview from "./superadmin/StockOverview";
import { Bookings } from "./superadmin/ReservationPage";
>>>>>>> Stashed changes

// What each department sees on its dashboard (the backend enforces the same rules - AccessPolicy.java).
const TABS = {
  orders: { label: "🍽️ Orders" },
  kot: { label: "🔥 Kitchen KOT" },
  billing: { label: "🧾 Billing" },
  bookings: { label: "🛏️ Room Reservations" },
  stock: { label: "📦 Inventory & Purchases" },
};
const TABS_FOR = {
  MANAGER: ["orders", "billing", "bookings", "stock"],
  RESTAURANT: ["orders"], // captain
  KITCHEN: ["kot"],
  RECEPTION: ["bookings"], // front desk: room reservations only
  SUPER_ADMIN: ["orders", "billing", "bookings", "stock"],
};

// Captain / manager: take orders, follow them through the kitchen and send them to Billing.
function OrdersTab({ role }) {
  const boardState = useBoard();
  const [deskOpen, setDeskOpen] = useState(false);
  const manager = role === "MANAGER" || isSuper(role);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {role === "RESTAURANT"
            ? "Take orders and send them to the kitchen. When the kitchen marks an order ready, serve it and send it to Billing."
            : "Live orders - refreshes every few seconds."}
        </p>
        <button onClick={() => setDeskOpen((o) => !o)} className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">
          {deskOpen ? "Close order desk" : "➕ Take Order (Table / Room / Online)"}
        </button>
      </div>
      {deskOpen && (
        <div className="mt-4 bg-white border rounded-2xl p-4">
          <OrderDesk onChanged={boardState.reload} />
        </div>
      )}
      <div className="mt-6">
        <OrdersBoard boardState={boardState} captain kitchen={manager} billingPath={manager ? "/manager?tab=billing" : undefined} />
      </div>
    </div>
  );
}

<<<<<<< Updated upstream
function KitchenRow({ order, onSet }) {
  const ready = order.kitchenStatus === "READY";
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${ready ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
        {ready ? "READY" : "PREPARING"}
      </span>
      <button onClick={() => onSet(order.id, ready ? "preparing" : "ready")} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
        {ready ? "Back to preparing" : "Mark ready"}
      </button>
    </div>
  );
}

const STATUS_STYLE = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-600",
};
=======
// Kitchen: new KOTs and their status.
function KitchenTab() {
  const boardState = useBoard(5000);
  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">New orders appear here automatically. Press “Mark Ready” when an order is made - the captain will then serve / ship it.</p>
      <OrdersBoard boardState={boardState} kitchen showBilled={false} />
    </div>
  );
}
>>>>>>> Stashed changes

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const role = user?.role;
<<<<<<< Updated upstream
  const seeOrders = canSeeOrders(role);
  const editOrders = canEditOrders(role);
  const seeBookings = canSeeBookings(role);

  const [board, setBoard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [deskOpen, setDeskOpen] = useState(false);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

  const loadBoard = useCallback(async () => {
    if (!seeOrders) return;
    try {
      setBoard(await apiFetch("/api/admin/orders/board"));
      setError("");
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [seeOrders, logout]);

  const loadBookings = useCallback(async () => {
    if (!seeBookings) return;
    try {
      const list = await apiFetch("/api/bookings");
      setBookings((list || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [seeBookings, logout]);

  // live view: refresh every 8 seconds
  useEffect(() => {
    loadBoard();
    loadBookings();
    const t = setInterval(() => { loadBoard(); loadBookings(); }, 8000);
    return () => clearInterval(t);
  }, [loadBoard, loadBookings]);

  const orderAction = async (id, action, okText) => {
    try {
      await apiFetch(`/api/admin/orders/${id}/${action}`, { method: "POST" });
      flash(okText);
      loadBoard();
    } catch (e) {
      flash("⚠️ " + e.message);
    }
  };

  const bookingStatus = async (id, status) => {
    try {
      await apiFetch(`/api/bookings/${id}/status?status=${status}`, { method: "PATCH" });
      flash(`✅ Booking #${id} is now ${status}`);
      loadBookings();
    } catch (e) {
      flash("⚠️ " + e.message);
    }
  };

  const tables = board?.tables || [];
  const occupied = tables.filter((t) => t.order).length;
  const roomOrders = board?.rooms || [];
  const online = board?.online || [];
  const pending = online.filter((o) => o.status === "PENDING");
  const accepted = online.filter((o) => o.status === "ACCEPTED");
=======
  const tabs = TABS_FOR[role] || [];
  const [params, setParams] = useSearchParams();
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : tabs[0];
  const title = { RESTAURANT: "Captain Dashboard", KITCHEN: "Kitchen Dashboard", RECEPTION: "Front Desk" }[role] || "Manager Dashboard";
>>>>>>> Stashed changes

  return (
    <div className="bg-[#FFFBF5] min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#1F3B2D]">{title}</h1>
            <p className="text-xs text-gray-500 mt-1">{user?.name} · {roleLabel(role)} · {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {isSuper(role) && <Link to="/super-admin" className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">Admin Dashboard</Link>}
            <button onClick={logout} className="px-5 py-2 rounded-full bg-red-100 text-red-700 text-sm font-bold">Logout</button>
          </div>
        </div>

        {tabs.length === 0 && <p className="mt-6 text-gray-500">Your department has no dashboard sections yet.</p>}

        {tabs.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setParams({ tab: t })}
                className={`px-5 py-2 rounded-full text-sm font-semibold border ${tab === t ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white text-gray-700"}`}
              >
                {TABS[t].label}
              </button>
            ))}
          </div>
        )}

<<<<<<< Updated upstream
        {seeOrders && (
          <>
            {/* TAKE ORDER (table / room / online) - staff only, not on the public website */}
            {editOrders && (
              <div className="mt-6">
                <button onClick={() => setDeskOpen((o) => !o)} className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">
                  {deskOpen ? "Close order desk" : "➕ Take Order (Table / Room / Online)"}
                </button>
                {deskOpen && (
                  <div className="mt-4 bg-white border rounded-2xl p-4">
                    <OrderDesk />
                  </div>
                )}
              </div>
            )}

            {/* SUMMARY */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["Tables occupied", `${occupied} / ${tables.length}`],
                ["Room service running", roomOrders.length],
                ["New online orders", pending.length],
                ["Online accepted", accepted.length],
              ].map(([label, value]) => (
                <div key={label} className="bg-white rounded-2xl border p-4 shadow-sm">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-[#1F3B2D]">{board ? value : "-"}</p>
                </div>
              ))}
            </div>

            {/* TABLES */}
            <h2 className="mt-10 mb-3 font-bold text-lg">🍽️ Tables</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tables.map((t) => {
                const o = t.order;
                return (
                  <div key={t.number} className={`bg-white rounded-2xl border p-4 ${o ? "border-orange-400" : ""}`}>
                    <div className="flex justify-between">
                      <h3 className="font-bold">Table {t.number}</h3>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${o ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {o ? "OCCUPIED" : "AVAILABLE"}
                      </span>
                    </div>
                    {!o ? (
                      <p className="text-xs text-gray-400 mt-6 text-center">No orders yet</p>
                    ) : (
                      <>
                        <p className="text-[11px] text-gray-400 mt-1">Since {timeOf(o.createdAt)}</p>
                        <Lines order={o} />{o.status !== "PENDING" && <KitchenRow order={o} onSet={(id, a) => orderAction(id, a, a === "ready" ? "✅ Marked ready" : "Back to preparing")} />}
                        {editOrders && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => orderAction(o.id, "paid", `✅ Table ${t.number} - bill paid - clean the table`)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Bill Paid - Free Table</button>
                            <button onClick={() => window.confirm("Cancel this order?") && orderAction(o.id, "cancel", `Table ${t.number} order cancelled`)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ROOM SERVICE */}
            <h2 className="mt-10 mb-3 font-bold text-lg">🛎️ Room Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {board && roomOrders.length === 0 && <p className="text-xs text-gray-400">No room-service orders right now</p>}
              {roomOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-orange-400 p-4">
                  <div className="flex justify-between">
                    <h3 className="font-bold">Room {o.roomNumber}</h3>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">{timeOf(o.createdAt)}</span>
                  </div>
                  <Lines order={o} />{o.status !== "PENDING" && <KitchenRow order={o} onSet={(id, a) => orderAction(id, a, a === "ready" ? "✅ Marked ready" : "Back to preparing")} />}
                  {editOrders && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => orderAction(o.id, "paid", `✅ Room ${o.roomNumber} - bill paid`)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Bill Paid - Complete</button>
                      <button onClick={() => window.confirm("Cancel this order?") && orderAction(o.id, "cancel", `Room ${o.roomNumber} order cancelled`)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ONLINE */}
            <h2 className="mt-10 mb-3 font-bold text-lg">🛒 Online Orders</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {board && online.length === 0 && <p className="text-xs text-gray-400">No online orders right now</p>}
              {online.map((o) => (
                <div key={o.id} className={`bg-white rounded-2xl border p-4 ${o.status === "PENDING" ? "border-yellow-400" : "border-blue-300"}`}>
                  <div className="flex justify-between">
                    <h3 className="font-bold">Online #{o.id}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${o.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-700"}`}>
                      {o.status === "PENDING" ? "NEW" : "ACCEPTED"} · {timeOf(o.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{o.customerName} · {o.customerPhone}</p>
                  <Lines order={o} />{o.status !== "PENDING" && <KitchenRow order={o} onSet={(id, a) => orderAction(id, a, a === "ready" ? "✅ Marked ready" : "Back to preparing")} />}
                  {editOrders && (
                    <div className="flex gap-2 mt-3">
                      {o.status === "PENDING" ? (
                        <button onClick={() => orderAction(o.id, "accept", `✅ Online #${o.id} accepted`)} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Accept Order</button>
                      ) : (
                        <button onClick={() => orderAction(o.id, "paid", `✅ Online #${o.id} completed - bill paid`)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">Bill Paid - Complete</button>
                      )}
                      <button onClick={() => window.confirm("Reject / cancel this order?") && orderAction(o.id, "cancel", `Online #${o.id} cancelled`)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!editOrders && <p className="mt-6 text-xs text-gray-400">Your department can view orders but not change them.</p>}
          </>
        )}

        {/* BOOKINGS */}
        {seeBookings && (
          <>
            <h2 className="mt-10 mb-3 font-bold text-lg">🛏️ Room Bookings</h2>
            <div className="bg-white rounded-2xl border overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="text-left text-xs text-gray-500 border-b">
                  <tr>
                    <th className="p-3">#</th><th className="p-3">Guest</th><th className="p-3">Room</th>
                    <th className="p-3">Stay</th><th className="p-3">Guests</th><th className="p-3">Status</th><th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 && (
                    <tr><td colSpan="7" className="p-6 text-center text-gray-400">No bookings yet</td></tr>
                  )}
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="p-3">{b.id}</td>
                      <td className="p-3">
                        <div className="font-semibold">{b.guestName}</div>
                        <div className="text-xs text-gray-500">{b.phone} · {b.email}</div>
                      </td>
                      <td className="p-3">{b.room?.name || "Room"} ({b.room?.roomNumber})</td>
                      <td className="p-3">{b.checkIn} → {b.checkOut}</td>
                      <td className="p-3">{b.numberOfGuests}</td>
                      <td className="p-3"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_STYLE[b.status] || ""}`}>{b.status}</span></td>
                      <td className="p-3 whitespace-nowrap">
                        {b.status === "PENDING" && <button onClick={() => bookingStatus(b.id, "CONFIRMED")} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Confirm</button>}
                        {b.status === "CONFIRMED" && <button onClick={() => bookingStatus(b.id, "COMPLETED")} className="mr-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold">Complete</button>}
                        {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                          <button onClick={() => window.confirm("Cancel this booking?") && bookingStatus(b.id, "CANCELLED")} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
=======
        <div className="mt-6">
          {tab === "orders" && <OrdersTab role={role} />}
          {tab === "kot" && <KitchenTab />}
          {tab === "billing" && <BillingPage />}
          {tab === "bookings" && <Bookings />}
          {tab === "stock" && <StockOverview />}
        </div>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}
