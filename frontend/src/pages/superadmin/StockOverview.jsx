import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { inr } from "../../roles";
import { ymd, daysAgo } from "../../dates";
import { Badge } from "./ui";

// Read-only inventory, stock and purchase details for the manager dashboard.
export default function StockOverview() {
  const [items, setItems] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(ymd(new Date()));
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/inventory").then((d) => setItems(d || [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!from || !to || from > to) return;
    apiFetch(`/api/admin/purchases?from=${from}&to=${to}`)
      .then((d) => setPurchases(d || []))
      .catch((e) => setError(e.message));
  }, [from, to]);

  const list = items || [];
  const low = list.filter((i) => Number(i.quantity) <= Number(i.minLevel));
  const spend = purchases.reduce((s, p) => s + Number(p.totalCost || 0), 0);

  const cards = [
    ["Inventory items", items ? list.length : "-", "text-[#1F3B2D]"],
    ["Low stock", items ? low.length : "-", low.length ? "text-orange-600" : "text-green-600"],
    ["Purchases in period", purchases.length, "text-[#1F3B2D]"],
    ["Purchase spend", inr(spend), "text-[#B8893C]"],
  ];

  return (
    <div>
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-2xl border p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {low.length > 0 && (
        <p className="mt-4 bg-orange-50 border border-orange-200 text-orange-800 text-sm px-4 py-3 rounded-lg">
          ⚠️ Low stock - reorder soon: {low.map((i) => `${i.name} (${Number(i.quantity)} ${i.unit})`).join(", ")}
        </p>
      )}

      <h2 className="mt-8 mb-3 font-bold text-lg">📦 Stock in hand</h2>
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Item</th><th className="p-3">In stock</th><th className="p-3">Low-stock level</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {items && list.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">No inventory items yet</td></tr>}
            {list.map((it) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{it.name}</td>
                <td className="p-3">{Number(it.quantity)} {it.unit}</td>
                <td className="p-3">{Number(it.minLevel)} {it.unit}</td>
                <td className="p-3"><Badge on={Number(it.quantity) > Number(it.minLevel)} yes="OK" no="LOW" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-bold text-lg">🧾 Purchases</h2>
        <div className="flex items-end gap-2">
          <div><label className="block text-xs text-gray-500">From</label><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
          <div><label className="block text-xs text-gray-500">To</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Date</th><th className="p-3">Item</th><th className="p-3">Supplier</th><th className="p-3">Quantity</th><th className="p-3">Rate</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody>
            {purchases.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-400">No purchases in this period</td></tr>}
            {purchases.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{p.purchasedOn}</td>
                <td className="p-3 font-semibold">{p.itemName}</td>
                <td className="p-3">{p.supplier || "-"}</td>
                <td className="p-3">{Number(p.quantity)} {p.unit}</td>
                <td className="p-3">{inr(p.unitCost)}</td>
                <td className="p-3 text-right font-bold">{inr(p.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">Stock and purchases are added by the super admin. Stock goes up automatically with each purchase.</p>
    </div>
  );
}
