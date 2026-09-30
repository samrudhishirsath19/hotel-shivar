import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OrderDesk from "../components/OrderDesk";
import { roleLabel, isSuper } from "../roles";
import useBoard from "./superadmin/useBoard";
import OrdersBoard from "./superadmin/OrdersBoard";
import BillingPage from "./superadmin/BillingPage";
import StockOverview from "./superadmin/StockOverview";
import { Bookings } from "./superadmin/ReservationPage";

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

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const tabs = TABS_FOR[role] || [];
  const [params, setParams] = useSearchParams();
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : tabs[0];
  const title = { RESTAURANT: "Captain Dashboard", KITCHEN: "Kitchen Dashboard", RECEPTION: "Front Desk" }[role] || "Manager Dashboard";

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

        <div className="mt-6">
          {tab === "orders" && <OrdersTab role={role} />}
          {tab === "kot" && <KitchenTab />}
          {tab === "billing" && <BillingPage />}
          {tab === "bookings" && <Bookings />}
          {tab === "stock" && <StockOverview />}
        </div>
      </div>
    </div>
  );
}
