import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { inr } from "../../roles";
import { daysAgo, ymd } from "../../dates";
import useBoard from "./useBoard";
import { isReady } from "./Ticket";
import { BarChart, Donut, COLORS } from "../../components/charts";

// One-screen dashboard: 4 cards + a small 7-day sales bar graph. The full report is on its own page.
export default function Overview() {
  const { board, error } = useBoard();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const load = () =>
      apiFetch(`/api/admin/reports/sales?from=${daysAgo(6)}&to=${ymd(new Date())}`)
        .then(setReport)
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const tables = board?.tables || [];
  const occupied = tables.filter((t) => t.order).length;
  const rooms = board?.rooms || [];
  const online = board?.online || [];
  // running kitchen tickets that are not ready yet
  const kitchen = [...tables.filter((t) => t.order).map((t) => t.order), ...rooms, ...online.filter((o) => o.status === "ACCEPTED")];
  const pendingKot = kitchen.filter((o) => !isReady(o)).length;

  const days = report?.days || [];
  const num = (x) => Number(x || 0);
  const todayRevenue = days.length ? num(days[days.length - 1].total) : null;

  const cards = [
    ["Occupied Tables", board ? `${occupied} / ${board.tableCount}` : "-", "text-gray-900"],
    ["Online Orders", board ? online.length : "-", "text-blue-600"],
    ["Today's Revenue", todayRevenue === null ? "-" : inr(todayRevenue), "text-green-600"],
    ["Pending KOT", board ? pendingKot : "-", "text-orange-500"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <Link to="/super-admin/sales" className="text-sm font-semibold text-[#B8893C] hover:underline">Full sales report →</Link>
      </div>

      {error && <p className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
            <p className="text-sm text-gray-600">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-gray-700">
        Tip: This data is live from the backend and refreshes automatically every few seconds.
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-bold text-[#1F3B2D]">Sales - last 7 days</h3>
          <p className="text-xs text-gray-500 mb-2">Food & drinks and rooms side by side for each day</p>
          <BarChart
            labels={days.map((d) => d.date)}
            height={220}
            maxHeight={260}
            series={[
              { name: "Food & drinks", color: COLORS.food, values: days.map((d) => num(d.food)) },
              { name: "Rooms", color: COLORS.rooms, values: days.map((d) => num(d.rooms)) },
            ]}
          />
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-bold text-[#1F3B2D] mb-2">Food vs rooms</h3>
          <Donut slices={[
            { label: "Food & drinks", value: num(report?.totals?.food), color: COLORS.food },
            { label: "Rooms", value: num(report?.totals?.rooms), color: COLORS.rooms },
          ]} />
        </div>
      </div>
    </div>
  );
}
