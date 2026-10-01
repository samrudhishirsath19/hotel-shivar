import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { inr } from "../../roles";
import { inputCls } from "./ui";

// Staff order-taking: Table / Room / Online (phone) - the same choices the website used to show.
export default function TakeOrder({ onClose, onChanged }) {
  const [mode, setMode] = useState("table");
  const [menu, setMenu] = useState([]);
  const [tableCount, setTableCount] = useState(5);
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [table, setTable] = useState(1);
  const [room, setRoom] = useState("");
  const [lines, setLines] = useState([]); // items already on the chosen table / room
  const [cart, setCart] = useState({}); // online: menuItemId -> quantity
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: true, text: "" });

  useEffect(() => {
    apiFetch("/api/menu").then((d) => setMenu(d || [])).catch(() => setMsg({ ok: false, text: "Could not load the menu" }));
    apiFetch("/api/orders/config").then((c) => setTableCount(c.tableCount || 5)).catch(() => {});
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
    setBusy(true);
    try {
      const order = await apiFetch("/api/orders/online", {
        method: "POST",
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          items: cartItems.map((m) => ({ menuItemId: m.id, quantity: cart[m.id] })),
        }),
      });
      // taken by our own staff, so it goes straight to the kitchen
      await apiFetch(`/api/admin/orders/${order.id}/accept`, { method: "POST" });
      setCart({}); setName(""); setPhone("");
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
        <h3 className="font-bold text-gray-900">New order</h3>
        <button onClick={onClose} className="text-gray-500 text-xl leading-none px-2" aria-label="Close">×</button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {modeBtn("table", "🍽️ Table")}
        {modeBtn("room", "🛎️ Room service")}
        {modeBtn("online", "📞 Online / phone")}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {mode === "table" && (
          <>
            <span className="text-xs font-bold text-gray-500">Table:</span>
            {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setTable(n)} className={`w-9 h-9 rounded-full text-xs font-bold border ${table === n ? "bg-[#1F3B2D] text-white" : "bg-white"}`}>{n}</button>
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
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" inputMode="tel" className={inputCls + " !mt-0 max-w-[160px]"} />
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
