import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../api";

export default function Restaurant() {
  const [menu, setMenu] = useState([]);
  const [menuState, setMenuState] = useState("loading"); // loading | ok | error
  const [tableCount, setTableCount] = useState(5);
  const [roomNumbers, setRoomNumbers] = useState([]);

  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("All");
  const [orderType, setOrderType] = useState("table");
  const [selectedTable, setSelectedTable] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [lines, setLines] = useState([]); // what is already ordered for the selected table / room
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const { cart, addToCart } = useCart();

  const showToast = (txt) => { setToast(txt); setTimeout(() => setToast(""), 3000); };

  // ---- load menu, table count and room numbers from the backend
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

  // ---- what is already on the selected table / room (refreshed every 8 seconds)
  const targetType = orderType === "table" ? "TABLE" : orderType === "room" ? "ROOM" : "";
  const targetNumber = orderType === "table" ? String(selectedTable) : orderType === "room" ? String(selectedRoom) : "";

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

  // ---- filters (categories come from the menu itself, so new categories appear automatically)
  const byType = menu.filter((m) => typeFilter === "all" || m.type === typeFilter || m.type === "common");
  const visibleCats = ["All", ...Array.from(new Set(byType.map((m) => m.category)))];
  const filtered = byType.filter((m) => catFilter === "All" || m.category === catFilter);

  const getQty = (id) => {
    if (orderType === "online") return cart.find((o) => o.id === id)?.qty || 0;
    return lines.find((l) => l.menuItemId === id)?.quantity || 0;
  };

  const adjust = async (item, delta) => {
    if (busy) return;
    if (!targetNumber) { showToast("⚠️ Please choose a table or room first"); return; }
    setBusy(true);
    try {
      const order = await apiFetch("/api/orders/adjust", {
        method: "POST",
        body: JSON.stringify({ type: targetType, number: targetNumber, menuItemId: item.id, delta }),
      });
      setLines(order.lines || []);
      if (delta > 0) {
        showToast(orderType === "table"
          ? `✅ Order sent to kitchen - Table ${targetNumber}: ${item.name} x 1`
          : `✅ Order sent to room service - Room ${targetNumber}: ${item.name} x 1`);
      }
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePlus = (item) => {
    if (orderType === "online") {
      addToCart(item, 1);
      showToast(`🛒 Added to cart: ${item.name} x 1`);
    } else {
      adjust(item, 1);
    }
  };

  const handleMinus = (item) => {
    if (orderType === "online") addToCart(item, -1);
    else adjust(item, -1);
  };

  return (
    <div className="bg-[#FFFBF5] min-h-screen pb-10">
      {toast && (
        <div className="fixed top-[80px] left-1/2 -translate-x-1/2 bg-[#1F3B2D] text-white px-6 py-3 rounded-full shadow-lg font-bold z-[9999] text-sm text-center">
          {toast}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <h1 className="font-serif text-3xl text-[#1F3B2D]">Our Menu</h1>
          <div className="flex flex-col gap-2 bg-white border rounded-2xl px-4 py-3 shadow-sm min-w-[320px]">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
              <button onClick={() => setOrderType("online")} className={`flex-1 px-3 py-1.5 rounded-full text-xs font-bold ${orderType === "online" ? "bg-[#1F3B2D] text-white" : "text-gray-600"}`}>🛒 Online</button>
              <button onClick={() => setOrderType("table")} className={`flex-1 px-3 py-1.5 rounded-full text-xs font-bold ${orderType === "table" ? "bg-[#1F3B2D] text-white" : "text-gray-600"}`}>🍽️ Table</button>
              <button onClick={() => setOrderType("room")} className={`flex-1 px-3 py-1.5 rounded-full text-xs font-bold ${orderType === "room" ? "bg-[#B8893C] text-white" : "text-gray-600"}`}>🛎️ Room</button>
            </div>
            {orderType === "table" && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500">Table:</span>
                {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setSelectedTable(n)} className={`w-8 h-8 rounded-full text-xs font-bold border ${selectedTable === n ? "bg-[#1F3B2D] text-white" : "bg-white"}`}>{n}</button>
                ))}
              </div>
            )}
            {orderType === "room" && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500">Room:</span>
                {roomNumbers.length === 0 && <span className="text-xs text-gray-400">No rooms yet</span>}
                {roomNumbers.map((n) => (
                  <button key={n} onClick={() => setSelectedRoom(n)} className={`px-3 h-8 rounded-full text-xs font-bold border ${selectedRoom === n ? "bg-[#B8893C] text-white" : "bg-white"}`}>{n}</button>
                ))}
              </div>
            )}
            {orderType === "online" && (
              <p className="text-[11px] text-gray-500 mt-1">Add items, then open the 🛒 Cart at the top and press Place Order.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 items-center flex-wrap">
          <button onClick={() => { setTypeFilter("all"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "all" ? "bg-[#1F3B2D] text-white" : "bg-white"}`}>All</button>
          <button onClick={() => { setTypeFilter("veg"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "veg" ? "bg-green-600 text-white" : "bg-white"}`}>🟩 Veg Only</button>
          <button onClick={() => { setTypeFilter("nonveg"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "nonveg" ? "bg-red-600 text-white" : "bg-white"}`}>🟥 Non-Veg</button>
          <Link to="/manager" className="ml-auto px-5 py-2 rounded-full text-xs font-bold bg-[#B8893C] text-white shadow">Staff View →</Link>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {visibleCats.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium border ${catFilter === c ? "bg-[#B8893C] text-white border-[#B8893C]" : "bg-white text-gray-600"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {menuState === "loading" && <p className="text-center text-gray-500 py-16">Loading menu...</p>}
        {menuState === "error" && <p className="text-center text-red-600 py-16">Could not load the menu. Please check that the backend is running.</p>}
        {menuState === "ok" && filtered.length === 0 && <p className="text-center text-gray-500 py-16">No items to show.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const q = getQty(item.id);
            return (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border flex flex-col">
                {item.imageUrl ? (
                  <img src={item.imageUrl} loading="lazy" className="w-full h-40 object-cover" alt={item.name} />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-3xl">🍽️</div>
                )}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif text-[#1F3B2D] text-[15px]">{item.name}</h3>
                      <span className="text-[#B8893C] font-bold text-sm">₹{item.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex items-center border rounded-lg">
                      <button onClick={() => handleMinus(item)} className="px-3 py-1 font-bold text-lg select-none">-</button>
                      <span className="px-2 text-sm w-6 text-center font-bold text-[#1F3B2D]">{q}</span>
                      <button onClick={() => handlePlus(item)} className="px-3 py-1 font-bold text-lg select-none">+</button>
                    </div>
                    <button onClick={() => handlePlus(item)} className={`flex-1 text-center text-xs font-bold py-2 rounded-lg border transition ${q > 0 ? "bg-[#1F3B2D] text-white" : "bg-white text-gray-600 hover:bg-[#1F3B2D] hover:text-white"}`}>
                      {q > 0 ? `${q} x Added ✓` : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
