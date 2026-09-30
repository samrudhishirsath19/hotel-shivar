import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { inr } from "../../roles";
import { ymd } from "../../dates";
import useBoard from "./useBoard";
import SalesTab from "../admin/SalesTab";

export default function Overview() {
  const { board, error } = useBoard();
  const [revenue, setRevenue] = useState(null);

  // today's revenue (food bills paid today + room bookings made today)
  useEffect(() => {
    const load = () => {
      const day = ymd(new Date());
      apiFetch(`/api/admin/reports/sales?from=${day}&to=${day}`)
        .then((r) => setRevenue(Number(r.totals.total)))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const tables = board?.tables || [];
  const occupied = tables.filter((t) => t.order).length;
  const rooms = board?.rooms || [];
  const online = board?.online || [];
  const acceptedOnline = online.filter((o) => o.status === "ACCEPTED").length;
  // every running kitchen ticket: occupied tables + room service + accepted online orders
  const pendingKot = occupied + rooms.length + acceptedOnline;

  const cards = [
    ["Occupied Tables", board ? `${occupied} / ${board.tableCount}` : "-", "text-gray-900"],
    ["Online Orders", board ? online.length : "-", "text-blue-600"],
    ["Today's Revenue", revenue === null ? "-" : inr(revenue), "text-green-600"],
    ["Pending KOT", board ? pendingKot : "-", "text-orange-500"],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      {error && <p className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-5 shadow-sm">
            <p className="text-sm text-gray-600">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm text-gray-700">
        Tip: This data is live from the backend and refreshes automatically every few seconds.
      </div>

      <h2 className="mt-10 mb-4 text-xl font-bold text-gray-900">Sales</h2>
      <SalesTab />
    </div>
  );
}
