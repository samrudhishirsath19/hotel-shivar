import { useState, useEffect, useCallback } from "react";
<<<<<<< HEAD
import { can } from "../../roles";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
=======
import { apiFetch } from "../../api";
>>>>>>> origin/sakshi
import { PageTitle, Notice, Badge, inputCls } from "./ui";

const blank = { name: "", unit: "kg", quantity: "", minLevel: "" };
const UNITS = ["kg", "g", "litre", "ml", "piece", "packet", "dozen", "box"];

export default function InventoryPage() {
<<<<<<< HEAD
  const { user } = useAuth();
  const manage = can(user?.role, "INVENTORY_MANAGE"); // without it the page is view-only
=======
>>>>>>> origin/sakshi
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/api/admin/inventory").then((d) => setItems(d || [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const flash = (t) => { setOk(t); setTimeout(() => setOk(""), 3000); };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch(editingId ? `/api/admin/inventory/${editingId}` : "/api/admin/inventory", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          unit: form.unit.trim(),
          quantity: Number(form.quantity),
          minLevel: form.minLevel === "" ? 0 : Number(form.minLevel),
        }),
      });
      flash(editingId ? "✅ Item updated" : "✅ Item added");
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (it) => {
    setEditingId(it.id);
    setForm({ name: it.name, unit: it.unit, quantity: String(it.quantity), minLevel: String(it.minLevel) });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.name}" from inventory?`)) return;
    try {
      await apiFetch(`/api/admin/inventory/${it.id}`, { method: "DELETE" });
      flash("Item deleted");
      if (editingId === it.id) { setEditingId(null); setForm(blank); }
      load();
    } catch (err) { setError(err.message); }
  };

  const low = items.filter((i) => Number(i.quantity) <= Number(i.minLevel));

  return (
    <div>
      <PageTitle title="Inventory" sub="Stock in hand. Stock goes up automatically when you record a purchase." />

      {low.length > 0 && (
        <p className="mb-4 bg-orange-50 border border-orange-200 text-orange-800 text-sm px-4 py-3 rounded-lg">
          Low stock: {low.map((i) => i.name).join(", ")}
        </p>
      )}

<<<<<<< HEAD
      {manage && (
=======
>>>>>>> origin/sakshi
      <form onSubmit={save} className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900">{editingId ? "Edit item" : "Add an inventory item"}</h3>
        <Notice error={error} ok={ok} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold">Item name</label>
            <input required value={form.name} onChange={set("name")} placeholder="e.g. Basmati rice" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Unit</label>
            <input required list="inv-units" value={form.unit} onChange={set("unit")} className={inputCls} />
            <datalist id="inv-units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
          </div>
          <div>
            <label className="text-xs font-semibold">Quantity in stock</label>
            <input required type="number" min="0" step="0.01" value={form.quantity} onChange={set("quantity")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Low-stock level</label>
            <input type="number" min="0" step="0.01" value={form.minLevel} onChange={set("minLevel")} placeholder="0" className={inputCls} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={saving} className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save changes" : "Add item"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(blank); setError(""); }} className="px-5 py-2 rounded-full bg-gray-100 text-sm font-bold">Cancel edit</button>
          )}
        </div>
      </form>
<<<<<<< HEAD
      )}
=======
>>>>>>> origin/sakshi

      <h3 className="mt-6 font-bold text-gray-900">All items ({items.length})</h3>
      <div className="mt-3 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="text-left text-xs text-gray-500 border-b">
<<<<<<< HEAD
            <tr><th className="p-3">Item</th><th className="p-3">In stock</th><th className="p-3">Low-stock level</th><th className="p-3">Status</th>{manage && <th className="p-3">Actions</th>}</tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={manage ? 5 : 4} className="p-6 text-center text-gray-400">No items yet</td></tr>}
=======
            <tr><th className="p-3">Item</th><th className="p-3">In stock</th><th className="p-3">Low-stock level</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-400">No items yet</td></tr>}
>>>>>>> origin/sakshi
            {items.map((it) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{it.name}</td>
                <td className="p-3">{Number(it.quantity)} {it.unit}</td>
                <td className="p-3">{Number(it.minLevel)} {it.unit}</td>
                <td className="p-3"><Badge on={Number(it.quantity) > Number(it.minLevel)} yes="OK" no="LOW" /></td>
<<<<<<< HEAD
                {manage && (<td className="p-3 whitespace-nowrap">
                  <button onClick={() => edit(it)} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={() => remove(it)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
                </td>)}
=======
                <td className="p-3 whitespace-nowrap">
                  <button onClick={() => edit(it)} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={() => remove(it)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
                </td>
>>>>>>> origin/sakshi
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
