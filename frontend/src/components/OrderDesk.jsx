import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { inr } from "../roles";

// Staff order desk: take an order for a table, a room (room service) or an online / phone customer.
// Used inside the dashboards only - the public website has no table / room ordering.
// target = { mode: "table" | "room", number, at } lets a page jump straight to one table or room.
export default function OrderDesk({ target }) {
  const [menu, setMenu] = useState([]);
  const [menuState, setMenuState] = useState("loading"); // loading | ok | error
  const [tableCount, setTableCount] = useState(5);
  const [roomNumbers, setRoomNumbers] = useState([]);

  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("All");
  const [mode, setMode] = useState("table"); // table | room | online
  const [selectedTable, setSelectedTable] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [lines, setLines] = useState([]); // what is already on the selected table / room
  const [cart, setCart] = useState([]); // online / phone order being built
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (txt) => { setToast(txt); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    apiFetch("/api/menu")
      .then((d) => { setMenu(d || []); setMenuState("ok"); })
      .catch(() => setMenuState("error"));
    apiFetch("/api/orders/config").then((c) => setTableCount(c.tableCount || 5)).catch(() => {});
    apiFetch("/api/rooms")
      .then((r) => {
        const nums = (r || []).map((x) => x.roomNumber).sort();
        setRoomNumbers(nums);
        if (nums.length > 0) setSelectedRoom((cur) => cur || nums[0]);
      })
      .catch(() => {});
  }, []);

  // another page asked for a specific table / room
  useEffect(() => {
    if (!target) return;
    setMode(target.mode);
    if (target.mode === "table") setSelectedTable(Number(target.number));
    else setSelectedRoom(String(target.number));
  }, [target]);

  const targetType = mode === "table" ? "TABLE" : mode === "room" ? "ROOM" : "";
  const targetNumber = mode === "table" ? String(selectedTable) : mode === "room" ? String(selectedRoom) : "";

  // items already ordered for the selected table / room (refreshed every 8 seconds)
  useEffect(() => {
    if (!targetType || !targetNumber) { setLines([]); return undefined; }
    let cancelled = false;
    const load = () =>
      apiFetch(`/api/orders/current?type=${targetType}&number=${encodeURIComponent(targetNumber)}`)
        .then((d) => { if (!cancelled) setLines(d || []); })
        .catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(t); };
  }, [targetType, targetNumber]);

  const byType = menu.filter((m) => typeFilter === "all" || m.type === typeFilter || m.type === "common");
  const cats = ["All", ...Array.from(new Set(byType.map((m) => m.category)))];
  const filtered = byType.filter((m) => catFilter === "All" || m.category === catFilter);

  const getQty = (id) =>
    mode === "online"
      ? cart.find((c) => c.id === id)?.qty || 0
      : lines.find((l) => l.menuItemId === id)?.quantity || 0;

  const changeCart = (item, delta) =>
    setCart((prev) => {
      const ex = prev.find((p) => p.id === item.id);
      if (ex) {
        const q = ex.qty + delta;
        return q <= 0 ? prev.filter((p) => p.id !== item.id) : prev.map((p) => (p.id === item.id ? { ...p, qty: q } : p));
      }
      return delta > 0 ? [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: delta }] : prev;
    });

  const adjust = async (item, delta) => {
    if (busy) return;
    if (!targetNumber) { flash("⚠️ Choose a table or room first"); return; }
    setBusy(true);
    try {
      const order = await apiFetch("/api/orders/adjust", {
        method: "POST",
        body: JSON.stringify({ type: targetType, number: targetNumber, menuItemId: item.id, delta }),
      });
      setLines(order.lines || []);
      if (delta > 0) flash(`✅ Sent to kitchen - ${mode === "table" ? "Table" : "Room"} ${targetNumber}: ${item.name} x 1`);
    } catch (e) {
      flash("⚠️ " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const plus = (item) => (mode === "online" ? changeCart(item, 1) : adjust(item, 1));
  const minus = (item) => (mode === "online" ? changeCart(item, -1) : adjust(item, -1));

  const placeOnline = async () => {
    if (!custName.trim() || !custPhone.trim()) { flash("⚠️ Enter the customer's name and mobile number"); return; }
    setPlacing(true);
    try {
      await apiFetch("/api/orders/online", {
        method: "POST",
        body: JSON.stringify({
          customerName: custName.trim(),
          customerPhone: custPhone.trim(),
          items: cart.map((c) => ({ menuItemId: c.id, quantity: c.qty })),
        }),
      });
      setCart([]); setCustName(""); setCustPhone("");
      flash("✅ Online order created - accept it in KOT");
    } catch (e) {
      flash("⚠️ " + e.message);
    } finally {
      setPlacing(false);
    }
  };

  const runningTotal = lines.reduce((s, l) => s + Number(l.unitPrice) * l.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const modeBtn = (id, active) => `flex-1 px-3 py-1.5 rounded-full text-xs font-bold ${mode === id ? active : "text-gray-600"}`;

  return (
    <div>
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#1F3B2D] text-white px-6 py-3 rounded-full shadow-lg font-bold z-[9999] text-sm text-center">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-2 bg-white border rounded-2xl px-4 py-3 shadow-sm w-full md:max-w-md">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
            <button onClick={() => setMode("online")} className={modeBtn("online", "bg-[#1F3B2D] text-white")}>🛒 Online</button>
            <button onClick={() => setMode("table")} className={modeBtn("table", "bg-[#1F3B2D] text-white")}>🍽️ Table</button>
            <button onClick={() => setMode("room")} className={modeBtn("room", "bg-[#B8893C] text-white")}>🛎️ Room</button>
          </div>
          {mode === "table" && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] font-bold text-gray-500">Table:</span>
              {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setSelectedTable(n)} className={`w-8 h-8 rounded-full text-xs font-bold border ${selectedTable === n ? "bg-[#1F3B2D] text-white" : "bg-white"}`}>{n}</button>
              ))}
            </div>
          )}
          {mode === "room" && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] font-bold text-gray-500">Room:</span>
              {roomNumbers.length === 0 && <span className="text-xs text-gray-400">No rooms yet</span>}
              {roomNumbers.map((n) => (
                <button key={n} onClick={() => setSelectedRoom(n)} className={`px-3 h-8 rounded-full text-xs font-bold border ${selectedRoom === n ? "bg-[#B8893C] text-white" : "bg-white"}`}>{n}</button>
              ))}
            </div>
          )}
          {mode !== "online" && (
            <p className="text-[11px] text-gray-500 mt-1">
              {mode === "table" ? "Table" : "Room"} {targetNumber || "-"}: {lines.length === 0 ? "nothing ordered yet" : `${lines.reduce((s, l) => s + l.quantity, 0)} items · ${inr(runningTotal)}`}
            </p>
          )}
        </div>

        {mode === "online" && (
          <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm w-full md:max-w-sm">
            <p className="text-sm font-bold text-[#1F3B2D]">Online / phone order · {inr(cartTotal)}</p>
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 mt-2">Add items below.</p>
            ) : (
              <>
                <div className="mt-2 divide-y">
                  {cart.map((c) => (
                    <div key={c.id} className="flex justify-between text-xs py-1">
                      <span>{c.qty} x {c.name}</span><span>{inr(c.price * c.qty)}</span>
                    </div>
                  ))}
                </div>
                <input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Customer name" className="w-full mt-3 border rounded-lg px-3 py-2 text-sm" />
                <input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="Mobile number" inputMode="tel" className="w-full mt-2 border rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-2 mt-3">
                  <button onClick={placeOnline} disabled={placing} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold disabled:opacity-60">{placing ? "Sending..." : "Place order"}</button>
                  <button onClick={() => setCart([])} className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-bold">Clear</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5 items-center flex-wrap">
        <button onClick={() => { setTypeFilter("all"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "all" ? "bg-[#1F3B2D] text-white" : "bg-white"}`}>All</button>
        <button onClick={() => { setTypeFilter("veg"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "veg" ? "bg-green-600 text-white" : "bg-white"}`}>🟩 Veg Only</button>
        <button onClick={() => { setTypeFilter("nonveg"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "nonveg" ? "bg-red-600 text-white" : "bg-white"}`}>🟥 Non-Veg</button>
      </div>
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium border ${catFilter === c ? "bg-[#B8893C] text-white border-[#B8893C]" : "bg-white text-gray-600"}`}>{c}</button>
        ))}
      </div>

      {menuState === "loading" && <p className="text-center text-gray-500 py-10">Loading menu...</p>}
      {menuState === "error" && <p className="text-center text-red-600 py-10">Could not load the menu. Check that the backend is running.</p>}
      {menuState === "ok" && filtered.length === 0 && <p className="text-center text-gray-500 py-10">No items to show.</p>}

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const q = getQty(item.id);
          return (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden border flex">
              {item.imageUrl ? (
                <img src={item.imageUrl} loading="lazy" alt={item.name} className="w-24 h-auto object-cover" />
              ) : (
                <div className="w-24 bg-gray-100 flex items-center justify-center text-2xl">🍽️</div>
              )}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-sm text-[#1F3B2D]">{item.name}</h3>
                  <span className="text-[#B8893C] font-bold text-sm">₹{item.price}</span>
                </div>
                <div className="flex items-center border rounded-lg self-start mt-2">
                  <button onClick={() => minus(item)} className="px-3 py-1 font-bold text-lg select-none">-</button>
                  <span className="px-2 text-sm w-6 text-center font-bold text-[#1F3B2D]">{q}</span>
                  <button onClick={() => plus(item)} className="px-3 py-1 font-bold text-lg select-none">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
