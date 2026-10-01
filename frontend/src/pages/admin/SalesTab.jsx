import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { inr } from "../../roles";
import { LineChart, BarChart, Donut, HBar, COLORS } from "../../components/charts";

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const prettyDay = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });

function Card({ title, sub, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm ${className}`}>
      <h3 className="font-bold text-[#1F3B2D]">{title}</h3>
      {sub && <p className="text-xs text-gray-500 mb-3">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </div>
  );
}

export default function SalesTab() {
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [itemDay, setItemDay] = useState("");

  useEffect(() => {
    if (!from || !to || from > to) return;
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/admin/reports/sales?from=${from}&to=${to}`)
      .then((r) => {
        if (cancelled) return;
        setReport(r);
        setError("");
        // default the "items on a day" chart to the most recent day that has item sales
        const daysWithItems = Object.keys(r.itemsByDay || {});
        setItemDay((cur) => (cur && daysWithItems.includes(cur) ? cur : daysWithItems[daysWithItems.length - 1] || ""));
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const quick = (n) => { setFrom(daysAgo(n)); setTo(daysAgo(0)); };

  const days = report?.days || [];
  const labels = days.map((d) => d.date);
  const num = (x) => Number(x || 0);
  const totals = report?.totals;

  const itemsOnDay = (report?.itemsByDay?.[itemDay] || []).map((i) => ({
    label: i.name, value: num(i.revenue), note: `${i.quantity} sold`,
  }));
  const topItems = (report?.items || []).slice(0, 10).map((i) => ({
    label: i.name, value: num(i.revenue), note: `${i.quantity} sold`,
  }));
  const roomRows = (report?.rooms || []).map((r) => ({
    label: r.room, value: num(r.revenue), note: `${r.bookings} booking${r.bookings === 1 ? "" : "s"}, ${r.nights} night${r.nights === 1 ? "" : "s"}`,
  }));

  return (
    <div>
      {/* DATE RANGE */}
      <div className="flex flex-wrap items-end gap-3 bg-white border rounded-2xl p-4">
        <div>
          <label className="block text-xs text-gray-500">From</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">To</label>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => quick(0)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Today</button>
        <button onClick={() => quick(6)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Last 7 days</button>
        <button onClick={() => quick(29)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Last 30 days</button>
        {loading && <span className="text-xs text-gray-400">Loading...</span>}
      </div>

      {error && <p className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      {report && (
        <>
          {/* TOTALS */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              ["Total sales", inr(totals.total), COLORS.total],
              ["Food & drinks", inr(totals.food), COLORS.food],
              ["Rooms", inr(totals.rooms), COLORS.rooms],
              ["Paid orders", totals.orders, "#374151"],
              ["Room bookings", totals.bookings, "#374151"],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-white rounded-2xl border p-4 shadow-sm">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl md:text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* OVERALL */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card title="Day-wise total sales" sub="Food + rooms for each day (line chart)" className="lg:col-span-2">
              <LineChart
                labels={labels}
                series={[
                  { name: "Total", color: COLORS.total, values: days.map((d) => num(d.total)) },
                  { name: "Food & drinks", color: COLORS.food, values: days.map((d) => num(d.food)) },
                  { name: "Rooms", color: COLORS.rooms, values: days.map((d) => num(d.rooms)) },
                ]}
              />
            </Card>
            <Card title="Food vs rooms" sub="Share of sales in this period (donut chart)">
              <Donut slices={[
                { label: "Food & drinks", value: num(totals.food), color: COLORS.food },
                { label: "Rooms", value: num(totals.rooms), color: COLORS.rooms },
              ]} />
            </Card>
          </div>

          {/* FOOD ITEMS */}
          <h2 className="mt-10 mb-3 font-bold text-lg text-[#1F3B2D]">🍽️ Food &amp; drink items</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card title="Food sales per day" sub="Paid restaurant, room-service and online orders (bar chart)">
              <BarChart labels={labels} series={[{ name: "Food & drinks", color: COLORS.food, values: days.map((d) => num(d.food)) }]} height={240} />
            </Card>
            <Card title="Top items in this period" sub="By sales amount">
              <HBar rows={topItems} color={COLORS.food} />
            </Card>
            <Card title="Items sold on one day" sub="Pick a day">
              <select value={itemDay} onChange={(e) => setItemDay(e.target.value)} className="mb-3 border rounded-lg px-3 py-1.5 text-sm w-full">
                {Object.keys(report.itemsByDay || {}).length === 0 && <option value="">No item sales</option>}
                {Object.keys(report.itemsByDay || {}).map((d) => <option key={d} value={d}>{prettyDay(d)}</option>)}
              </select>
              <HBar rows={itemsOnDay} color="#2f6b4f" empty="No item sales" />
            </Card>
          </div>

          {/* ROOMS */}
          <h2 className="mt-10 mb-3 font-bold text-lg text-[#1F3B2D]">🛏️ Rooms</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card title="Room sales per day" sub="Confirmed / completed bookings, counted on the booking day (bar chart)" className="lg:col-span-2">
              <BarChart labels={labels} series={[{ name: "Rooms", color: COLORS.rooms, values: days.map((d) => num(d.rooms)) }]} height={240} />
            </Card>
            <Card title="Sales by room" sub="Nights x price per night">
              <HBar rows={roomRows} color={COLORS.rooms} />
            </Card>
          </div>

          {/* TABLE */}
          <h2 className="mt-10 mb-3 font-bold text-lg text-[#1F3B2D]">Daily figures</h2>
          <div className="bg-white rounded-2xl border overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="text-left text-xs text-gray-500 border-b">
                <tr><th className="p-3">Date</th><th className="p-3">Food</th><th className="p-3">Rooms</th><th className="p-3">Total</th><th className="p-3">Orders</th><th className="p-3">Bookings</th></tr>
              </thead>
              <tbody>
                {days.slice().reverse().map((d) => (
                  <tr key={d.date} className="border-b last:border-0">
                    <td className="p-3">{prettyDay(d.date)}</td>
                    <td className="p-3">{inr(d.food)}</td>
                    <td className="p-3">{inr(d.rooms)}</td>
                    <td className="p-3 font-bold">{inr(d.total)}</td>
                    <td className="p-3">{d.orders}</td>
                    <td className="p-3">{d.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Food counts when the manager presses "Bill Paid" (on that day). Rooms count when a booking is Confirmed or Completed (on the day it was booked).
          </p>
        </>
      )}
    </div>
  );
}
