import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { inr, digits10, isPhone10, PHONE_ERROR } from "../../roles";
import { inputCls } from "./ui";

// Staff order-taking: Table / Room / Online (phone).
//   allowOnline = false -> no "Online / phone" choice (captain and manager)
//   onClose     -> shows a close button (omit when the screen is a page of its own)
export default function TakeOrder({ onClose, onChanged = () => {}, allowOnline = true }) {
  const [mode, setMode] = useState("table");
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]); // [{ tableNumber, capacity, status }]
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [table, setTable] = useState(1);
  const [room, setRoom] = useState("");
  const [lines, setLines] = useState([]); // items already on the chosen table / room
  const [cart, setCart] = useState({}); // online: menuItemId -> quantity
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: true, text: "" });

  useEffect(() => {
    apiFetch("/api/menu").then((d) => setMenu(d || [])).catch(() => setMsg({ ok: false, text: "Could not load the menu" }));
    apiFetch("/api/orders/config").then((c) => {
      const list = c.tables || [];
      setTables(list);
      setTable((cur) => (list.some((t) => t.tableNumber === cur) ? cur : list[0]?.tableNumber ?? cur));
    }).catch(() => {});
    apiFetch("/api/rooms").then((r) => {
      const nums = (r || []).map((x) => x.roomNumber).sort();
      setRoomNumbers(nums);
      setRoom((cur) => cur || nums[0] || "");
    }).catch(() => {});
  }, []);

  const targetType = mode === "table" ? "TABLE" : mode === "room" ? "ROOM" : "";
  const targetNumber = mode === "table" ? String(table) : mode === "room" ? String(room) : "";

  useEffect(() => {
    if (!targetType || !targetNumber) { setLines([]); return; }
    apiFetch(`/api/orders/current?type=${targetType}&number=${encodeURIComponent(targetNumber)}`)
      .then((d) => setLines(d || []))
      .catch(() => {});
  }, [targetType, targetNumber]);

  const cats = ["All", ...Array.from(new Set(menu.map((m) => m.category)))];
  const shown = menu.filter((m) =>
    (cat === "All" || m.category === cat) && m.name.toLowerCase().includes(search.toLowerCase())
  );

  const qtyOf = (id) =>
    mode === "online" ? cart[id] || 0 : lines.find((l) => l.menuItemId === id)?.quantity || 0;

  const change = async (item, delta) => {
    if (mode === "online") {
      setCart((c) => {
        const q = (c[item.id] || 0) + delta;
        const next = { ...c };
        if (q <= 0) delete next[item.id]; else next[item.id] = q;
        return next;
      });
      return;
    }
    if (!targetNumber) { setMsg({ ok: false, text: "Choose a table or room first" }); return; }
    if (busy) return;
    setBusy(true);
    try {
      const order = await apiFetch("/api/orders/adjust", {
        method: "POST",
        body: JSON.stringify({ type: targetType, number: targetNumber, menuItemId: item.id, delta }),
      });
      setLines(order.lines || []);
      setMsg({ ok: true, text: delta > 0 ? `Sent to kitchen: ${item.name}` : `Removed: ${item.name}` });
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const cartItems = menu.filter((m) => cart[m.id]);
  const cartTotal = cartItems.reduce((s, m) => s + Number(m.price) * cart[m.id], 0);

  const placeOnline = async () => {
    if (cartItems.length === 0) { setMsg({ ok: false, text: "Add at least one item" }); return; }
    if (!name.trim() || !phone.trim()) { setMsg({ ok: false, text: "Enter the customer's name and phone" }); return; }
    if (!isPhone10(phone)) { setMsg({ ok: false, text: PHONE_ERROR }); return; }
    if (address.trim().length < 10) { setMsg({ ok: false, text: "Enter the full delivery address" }); return; }
    setBusy(true);
    try {
      const order = await apiFetch("/api/orders/online", {
        method: "POST",
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          deliveryAddress: address.trim(),
          paymentMethod: "CASH_ON_DELIVERY", // phone orders are paid on delivery
          items: cartItems.map((m) => ({ menuItemId: m.id, quantity: cart[m.id] })),
        }),
      });
      // taken by our own staff, so it goes straight to the kitchen
      await apiFetch(`/api/admin/orders/${order.id}/accept`, { method: "POST" });
      setCart({}); setName(""); setPhone(""); setAddress("");
      setMsg({ ok: true, text: `Online order #${order.id} sent to kitchen` });
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const modeBtn = (id, label) => (
    <button onClick={() => { setMode(id); setMsg({ ok: true, text: "" }); }}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${mode === id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white text-gray-700"}`}>
      {label}
    </button>
  );

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm mb-8">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{onClose ? "New order" : "Take an order"}</h3>
        {onClose && <button onClick={onClose} className="text-gray-500 text-xl leading-none px-2" aria-label="Close">×</button>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {modeBtn("table", "🍽️ Table")}
        {modeBtn("room", "🛎️ Room service")}
        {allowOnline && modeBtn("online", "📞 Online / phone")}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {mode === "table" && (
          <>
            <span className="text-xs font-bold text-gray-500">Table:</span>
            {tables.length === 0 && <span className="text-xs text-gray-400">No tables yet</span>}
            {tables.map((t) => (
              <button key={t.tableNumber} onClick={() => setTable(t.tableNumber)} title={`${t.capacity} seats${t.status === "RESERVED" ? " · reserved" : ""}`}
                className={`min-w-9 h-9 px-2 rounded-full text-xs font-bold border ${table === t.tableNumber ? "bg-[#1F3B2D] text-white" : t.status === "RESERVED" ? "bg-yellow-50 border-yellow-300" : "bg-white"}`}>
                {t.tableNumber}<span className="font-normal opacity-70"> ·{t.capacity}</span>
              </button>
            ))}
          </>
        )}
        {mode === "room" && (
          <>
            <span className="text-xs font-bold text-gray-500">Room:</span>
            {roomNumbers.length === 0 && <span className="text-xs text-gray-400">No rooms yet</span>}
            {roomNumbers.map((n) => (
              <button key={n} onClick={() => setRoom(n)} className={`px-3 h-9 rounded-full text-xs font-bold border ${room === n ? "bg-[#B8893C] text-white" : "bg-white"}`}>{n}</button>
            ))}
          </>
        )}
        {mode === "online" && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" className={inputCls + " !mt-0 max-w-[200px]"} />
            <input value={phone} onChange={(e) => setPhone(digits10(e.target.value))} placeholder="10-digit phone" inputMode="numeric" className={inputCls + " !mt-0 max-w-[160px]"} />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" className={inputCls + " !mt-0 flex-1 min-w-[220px]"} />
            <span className="text-[11px] text-gray-500">💵 Cash on delivery</span>
          </>
        )}
      </div>

      {msg.text && (
        <p className={`mt-3 text-xs px-3 py-2 rounded-lg ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item..." className="border rounded-lg px-3 py-1.5 text-sm" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-white">
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {shown.map((it) => {
          const q = qtyOf(it.id);
          return (
            <div key={it.id} className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 ${q > 0 ? "bg-green-50 border-green-200" : ""}`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{it.name}</p>
                <p className="text-xs text-gray-500">{inr(it.price)} · {it.category}</p>
              </div>
              <div className="flex items-center border rounded-lg bg-white shrink-0">
                <button onClick={() => change(it, -1)} disabled={q === 0} className="px-3 py-1 font-bold disabled:opacity-30">-</button>
                <span className="w-6 text-center text-sm font-bold">{q}</span>
                <button onClick={() => change(it, 1)} className="px-3 py-1 font-bold">+</button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-gray-400 col-span-full py-4 text-center">No items found</p>}
      </div>

      {mode === "online" && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
          <p className="text-sm">{cartItems.length} item(s) · <b className="text-[#B8893C]">{inr(cartTotal)}</b></p>
          <button onClick={placeOnline} disabled={busy} className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {busy ? "Sending..." : "Send to kitchen"}
          </button>
        </div>
      )}
      {mode !== "online" && <p className="mt-3 text-xs text-gray-400">Each + goes straight to the kitchen (KOT). Payment is done later in Billing.</p>}
    </div>
  );
}
