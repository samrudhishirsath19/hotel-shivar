import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { inr, canSee } from "../../roles";
import { daysAgo, ymd } from "../../dates";
import useBoard from "./useBoard";
import { isPreparing, isReady, isInBilling } from "./Ticket";
import { PollChart, BarChart, Donut, COLORS } from "../../components/charts";
import { usePanel } from "./panelContext";
import { payable } from "../../gst";

const num = (x) => Number(x || 0);
const dayName = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
};

// One-screen dashboard: 4 cards + ONE poll-style chart. Every department sees the same layout,
// but only its own information (the super admin also has the full sales report on its own page).
export default function Overview() {
  const { user } = useAuth();
  const { base } = usePanel();
  const role = user?.role;
  const isSuper = role === "SUPER_ADMIN";
  // only load what this department's modules allow (Module Access)
  const usesBoard = ["kot", "tables", "online", "billing"].some((id) => canSee(role, id)); // live orders
  const usesBills = role === "BILLING" && canSee(role, "billing");      // today's paid bills
  const usesBookings = role === "RECEPTION" && canSee(role, "reservation");

  // super admin: "graphs" = bar graph + donut (as before), "poll" = one poll-style chart. Remembered in this browser.
  const [view, setView] = useState(() => {
    try { return localStorage.getItem("hs_dash_view") === "poll" ? "poll" : "graphs"; } catch { return "graphs"; }
  });
  const pickView = (v) => {
    setView(v);
    try { localStorage.setItem("hs_dash_view", v); } catch { /* storage blocked */ }
  };
  const graphs = isSuper && view === "graphs";

  const { board, error: boardError } = useBoard(8000, usesBoard);
  const [report, setReport] = useState(null);     // super admin: last 7 days of sales
  const [bills, setBills] = useState(null);       // manager / billing: bills paid today
  const [bookings, setBookings] = useState(null); // reception: room bookings
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const load = () => {
      const today = ymd(new Date());
      if (isSuper) {
        apiFetch(`/api/admin/reports/sales?from=${daysAgo(6)}&to=${today}`).then(setReport).catch(() => {});
      }
      if (usesBills) {
        apiFetch(`/api/admin/billing?from=${today}&to=${today}`).then(setBills).catch((e) => setLoadError(e.message));
      }
      if (usesBookings) {
        apiFetch("/api/bookings").then(setBookings).catch((e) => setLoadError(e.message));
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [isSuper, usesBills, usesBookings]);

  // ---- orders (from the live board)
  const tables = board?.tables || [];
  const occupied = tables.filter((t) => t.order).length;
  const rooms = board?.rooms || [];
  const online = board?.online || [];
  const running = [...tables.filter((t) => t.order).map((t) => t.order), ...rooms, ...online.filter((o) => o.status === "ACCEPTED")];
  const preparing = running.filter(isPreparing).length;
  const ready = running.filter(isReady).length;
  const inBilling = running.filter(isInBilling);
  const newOnline = online.filter((o) => o.status === "PENDING").length;
  const b = board ? (v) => v : () => "-";

  // ---- money
  const days = report?.days || [];
  const todayRevenue = days.length ? num(days[days.length - 1].total) : null;
  const paidToday = bills ? bills.reduce((s, x) => s + payable(x), 0) : null;
  const unpaidAmount = inBilling.reduce((s, o) => s + payable(o), 0);

  // ---- bookings
  const today = ymd(new Date());
  const count = (st) => (bookings || []).filter((x) => x.status === st).length;
  const checkInsToday = (bookings || []).filter((x) => x.checkIn === today && x.status !== "CANCELLED").length;

  // The one poll for each department
  const liveOrders = {
    title: "Live orders",
    sub: "Where the running orders are right now",
    money: false,
    empty: "No running orders",
    rows: [
      { label: "🍳 Preparing", value: preparing, color: "#f97316" },
      { label: "✅ Ready to serve / ship", value: ready, color: "#16a34a" },
      { label: "🧾 In billing", value: inBilling.length, color: "#2563eb" },
      { label: "🛒 New online", value: newOnline, color: "#eab308" },
    ],
  };

  let cards;
  let poll;
  if (role === "BILLING") {
    cards = [
      ["Unpaid Bills", board ? inBilling.length : "-", "text-orange-500"],
      ["Unpaid Amount", board ? inr(unpaidAmount) : "-", "text-gray-900"],
      ["Today's Bills", bills ? bills.length : "-", "text-blue-600"],
      ["Today's Collection", paidToday === null ? "-" : inr(paidToday), "text-green-600"],
    ];
    const by = (type) => (bills || []).filter((x) => x.orderType === type).reduce((s, x) => s + payable(x), 0);
    poll = {
      title: "Today's collection",
      sub: "Share of the bills paid today, by kind of order",
      money: true,
      empty: "No bills paid today",
      rows: [
        { label: "🍽️ Table bills", value: by("TABLE"), color: COLORS.food },
        { label: "🛎️ Room service", value: by("ROOM"), color: COLORS.rooms },
        { label: "🛒 Online orders", value: by("ONLINE"), color: COLORS.total },
      ],
    };
  } else if (role === "RECEPTION") {
    cards = [
      ["Pending Bookings", bookings ? count("PENDING") : "-", "text-orange-500"],
      ["Confirmed", bookings ? count("CONFIRMED") : "-", "text-green-600"],
      ["Check-ins Today", bookings ? checkInsToday : "-", "text-blue-600"],
      ["Total Bookings", bookings ? bookings.length : "-", "text-gray-900"],
    ];
    poll = {
      title: "Bookings by status",
      sub: "Share of all room bookings",
      money: false,
      empty: "No bookings yet",
      rows: [
        { label: "⏳ Pending", value: count("PENDING"), color: "#eab308" },
        { label: "✅ Confirmed", value: count("CONFIRMED"), color: "#16a34a" },
        { label: "🏨 Completed", value: count("COMPLETED"), color: "#2563eb" },
        { label: "✕ Cancelled", value: count("CANCELLED"), color: "#9ca3af" },
      ],
    };
  } else if (role === "KITCHEN") {
    cards = [
      ["Pending KOT", board ? preparing : "-", "text-orange-500"],
      ["Ready to Serve / Ship", board ? ready : "-", "text-green-600"],
      ["Occupied Tables", board ? `${occupied} / ${board.tableCount}` : "-", "text-gray-900"],
      ["Online Orders", b(online.length), "text-blue-600"],
    ];
    poll = liveOrders;
  } else if (role === "RESTAURANT") {
    cards = [
      ["Occupied Tables", board ? `${occupied} / ${board.tableCount}` : "-", "text-gray-900"],
      ["Online Orders", b(online.length), "text-blue-600"],
      ["Ready to Serve / Ship", board ? ready : "-", "text-green-600"],
      ["Pending KOT", board ? preparing : "-", "text-orange-500"],
    ];
    poll = liveOrders;
  } else if (role === "MANAGER") {
    cards = [
      ["Occupied Tables", board ? `${occupied} / ${board.tableCount}` : "-", "text-gray-900"],
      ["Online Orders", b(online.length), "text-blue-600"],
      ["Ready to Serve / Ship", board ? ready : "-", "text-green-600"],
      ["Pending KOT", board ? preparing : "-", "text-orange-500"],
    ];
    poll = liveOrders;
  } else {
    // super admin - same as before: the four cards and one poll of the last 7 days' sales
    cards = [
      ["Occupied Tables", board ? `${occupied} / ${board.tableCount}` : "-", "text-gray-900"],
      ["Online Orders", b(online.length), "text-blue-600"],
      ["Today's Revenue", todayRevenue === null ? "-" : inr(todayRevenue), "text-green-600"],
      ["Pending KOT", board ? preparing : "-", "text-orange-500"],
    ];
    poll = {
      title: "Sales - last 7 days",
      sub: "Each day's share of the week's sales",
      money: true,
      empty: "No sales in the last 7 days",
      rows: days.slice().reverse().map((d) => ({ label: dayName(d.date), value: num(d.total), color: COLORS.total })),
    };
  }

  const error = boardError || loadError;

  return (
    <div className="flex flex-col gap-4 md:h-full md:min-h-[460px]">
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        {isSuper && (
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border bg-white p-0.5 text-xs font-semibold">
              <button onClick={() => pickView("graphs")} className={`px-3 py-1 rounded-full ${view === "graphs" ? "bg-[#1F3B2D] text-white" : "text-gray-600"}`}>Graphs</button>
              <button onClick={() => pickView("poll")} className={`px-3 py-1 rounded-full ${view === "poll" ? "bg-[#1F3B2D] text-white" : "text-gray-600"}`}>Poll</button>
            </div>
            <Link to={`${base}/sales`} className="text-sm font-semibold text-[#B8893C] hover:underline">Full sales report →</Link>
          </div>
        )}
      </div>

      {error && <p className="shrink-0 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {cards.map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
            <p className="text-sm text-gray-600">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-gray-700 shrink-0">
        Tip: This data is live from the backend and refreshes automatically every few seconds.
      </div>

      {graphs ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:flex-1 md:min-h-0">
          <div className="lg:col-span-2 bg-white rounded-xl border p-4 shadow-sm flex flex-col min-h-0">
            <h3 className="font-bold text-[#1F3B2D] shrink-0">Sales - last 7 days</h3>
            <p className="text-xs text-gray-500 mb-2 shrink-0">Food &amp; drinks and rooms side by side for each day</p>
            <div className="h-64 md:h-auto md:flex-1 md:min-h-0">
              <BarChart
                fit
                labels={days.map((d) => d.date)}
                height={240}
                series={[
                  { name: "Food & drinks", color: COLORS.food, values: days.map((d) => num(d.food)) },
                  { name: "Rooms", color: COLORS.rooms, values: days.map((d) => num(d.rooms)) },
                ]}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col min-h-0">
            <h3 className="font-bold text-[#1F3B2D] mb-2 shrink-0">Food vs rooms</h3>
            <div className="md:flex-1 md:min-h-0 flex items-center justify-center">
              <Donut slices={[
                { label: "Food & drinks", value: num(report?.totals?.food), color: COLORS.food },
                { label: "Rooms", value: num(report?.totals?.rooms), color: COLORS.rooms },
              ]} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col md:flex-1 md:min-h-0">
          <h3 className="font-bold text-[#1F3B2D] shrink-0">{poll.title}</h3>
          <p className="text-xs text-gray-500 mb-3 shrink-0">{poll.sub}</p>
          <div className="md:flex-1 md:min-h-0 md:overflow-y-auto">
            <PollChart money={poll.money} empty={poll.empty} rows={poll.rows} />
          </div>
        </div>
      )}
    </div>
  );
}
