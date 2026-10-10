import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { inr, can } from "../../roles";
import { ymd, daysAgo } from "../../dates";
import { PageTitle, Notice, inputCls } from "./ui";

const blank = () => ({ inventoryItemId: "", supplier: "", quantity: "", unitCost: "", purchasedOn: ymd(new Date()), note: "" });

export default function PurchasePage() {
  const { user } = useAuth();
  const manage = can(user?.role, "PURCHASE_CREATE"); // without it the page is view-only
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState(blank);
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(ymd(new Date()));
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(() => {
    apiFetch("/api/admin/inventory").then((d) => setItems(d || [])).catch((e) => setError(e.message));
  }, []);
  const loadPurchases = useCallback(() => {
    if (!from || !to || from > to) return;
    apiFetch(`/api/admin/purchases?from=${from}&to=${to}`).then((d) => setPurchases(d || [])).catch((e) => setError(e.message));
  }, [from, to]);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const flash = (t) => { setOk(t); setTimeout(() => setOk(""), 3000); };
  const chosen = items.find((i) => String(i.id) === String(form.inventoryItemId));
  const lineTotal = Number(form.quantity || 0) * Number(form.unitCost || 0);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/admin/purchases", {
        method: "POST",
        body: JSON.stringify({
          inventoryItemId: Number(form.inventoryItemId),
          supplier: form.supplier.trim() || null,
          quantity: Number(form.quantity),
          unitCost: Number(form.unitCost),
          purchasedOn: form.purchasedOn || null,
          note: form.note.trim() || null,
        }),
      });
      flash("✅ Purchase saved - stock updated");
      setForm(blank());
      loadItems();
      loadPurchases();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete this purchase of ${p.itemName}? The quantity is taken back out of stock.`)) return;
    try {
      await apiFetch(`/api/admin/purchases/${p.id}`, { method: "DELETE" });
      flash("Purchase deleted");
      loadItems();
      loadPurchases();
    } catch (err) { setError(err.message); }
  };

  const spent = purchases.reduce((s, p) => s + Number(p.totalCost), 0);

  return (
    <div>
      <PageTitle title="Purchase" sub="Record stock bought from suppliers. It is added to Inventory automatically." />

      {manage && (items.length === 0 ? (
        <p className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg">
          Add your items in the Inventory page first, then record purchases here.
        </p>
      ) : (
      <form onSubmit={save} className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">New purchase</h3>
          <Notice error={error} ok={ok} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold">Item</label>
              <select required value={form.inventoryItemId} onChange={set("inventoryItemId")} className={inputCls + " bg-white"}>
                <option value="">Choose an item</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({Number(i.quantity)} {i.unit} in stock)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Quantity{chosen ? ` (${chosen.unit})` : ""}</label>
              <input required type="number" min="0.01" step="0.01" value={form.quantity} onChange={set("quantity")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold">Cost per unit (₹)</label>
              <input required type="number" min="0" step="0.01" value={form.unitCost} onChange={set("unitCost")} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold">Supplier</label>
              <input value={form.supplier} onChange={set("supplier")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold">Date</label>
              <input type="date" max={ymd(new Date())} value={form.purchasedOn} onChange={set("purchasedOn")} className={inputCls} />
            </div>
            <div className="flex items-end text-sm">Total: <b className="ml-2 text-[#B8893C]">{inr(lineTotal)}</b></div>
            <div className="md:col-span-4">
              <label className="text-xs font-semibold">Note (optional)</label>
              <input maxLength={500} value={form.note} onChange={set("note")} className={inputCls} />
            </div>
          </div>
          <button disabled={saving} className="mt-4 px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : "Save purchase"}
          </button>
        </form>
      ))}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-bold text-gray-900">Purchases · spent {inr(spent)}</h3>
        <div className="flex items-end gap-3">
          <div><label className="block text-xs text-gray-500">From</label><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
          <div><label className="block text-xs text-gray-500">To</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
        </div>
      </div>
      <div className="mt-3 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Date</th><th className="p-3">Item</th><th className="p-3">Supplier</th><th className="p-3">Quantity</th><th className="p-3">Cost / unit</th><th className="p-3">Total</th>{manage && <th className="p-3"></th>}</tr>
          </thead>
          <tbody>
            {purchases.length === 0 && <tr><td colSpan={manage ? 7 : 6} className="p-6 text-center text-gray-400">No purchases in this period</td></tr>}
            {purchases.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">{p.purchasedOn}</td>
                <td className="p-3 font-semibold">{p.itemName}</td>
                <td className="p-3">{p.supplier || "-"}</td>
                <td className="p-3">{Number(p.quantity)} {p.unit}</td>
                <td className="p-3">{inr(p.unitCost)}</td>
                <td className="p-3 font-bold">{inr(p.totalCost)}</td>
                {manage && (<td className="p-3"><button onClick={() => remove(p)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
