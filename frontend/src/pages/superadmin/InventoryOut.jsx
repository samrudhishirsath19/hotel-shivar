import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { can, cleanName, isFullName, NAME_ERROR, NAME_MAX } from "../../roles";
import { ymd, daysAgo, fmtDateTime } from "../../dates";
import { Notice, inputCls } from "./ui";

const fmtQty = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Inventory Out: stock issued from the store (item, quantity, date, who issued it). Saving lowers the stock.
export default function InventoryOut({ items, onChanged }) {
  const { user } = useAuth();
  const canIssue = can(user?.role, "INVENTORY_OUT");
  const blank = { inventoryItemId: "", quantity: "", issuedOn: ymd(new Date()), issuedBy: user?.name || "", issuedTo: "", note: "" };
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(ymd(new Date()));
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!from || !to || from > to) return;
    apiFetch(`/api/admin/inventory-out?from=${from}&to=${to}`).then((d) => setRows(d || [])).catch((e) => setError(e.message));
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const item = items.find((i) => String(i.id) === form.inventoryItemId);
  const qty = Number(form.quantity);
  const tooMuch = item && qty > Number(item.quantity);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!item) { setError("Choose an item"); return; }
    if (!(qty > 0)) { setError("Enter a quantity more than 0"); return; }
    if (tooMuch) { setError(`Only ${fmtQty(item.quantity)} ${item.unit} in stock`); return; }
    if (!isFullName(form.issuedBy)) { setError(`Issued by: ${NAME_ERROR}`); return; }
    setSaving(true);
    try {
      await apiFetch("/api/admin/inventory-out", {
        method: "POST",
        body: JSON.stringify({ ...form, inventoryItemId: Number(form.inventoryItemId), quantity: qty, issuedBy: cleanName(form.issuedBy) }),
      });
      setOk(`✅ ${fmtQty(qty)} ${item.unit} of ${item.name} issued - stock updated`);
      setTimeout(() => setOk(""), 3500);
      setForm({ ...blank, issuedBy: form.issuedBy, issuedOn: form.issuedOn });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete this entry? ${fmtQty(r.quantity)} ${r.unit || ""} of ${r.itemName} goes back into stock.`)) return;
    try {
      await apiFetch(`/api/admin/inventory-out/${r.id}`, { method: "DELETE" });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  // total issued per item in the shown period
  const totals = Object.values(rows.reduce((m, r) => {
    const k = r.itemName + "|" + (r.unit || "");
    m[k] = m[k] || { name: r.itemName, unit: r.unit, qty: 0 };
    m[k].qty += Number(r.quantity);
    return m;
  }, {})).sort((a, b) => b.qty - a.qty);

  return (
    <div>
      {canIssue && (
        <form onSubmit={save} className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">Record stock going out</h3>
          <p className="text-xs text-gray-500">E.g. rice issued to the kitchen, cleaning supplies to housekeeping. The stock goes down straight away.</p>
          <Notice error={error} ok={ok} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="text-xs font-semibold">Item</label>
              <select value={form.inventoryItemId} onChange={set("inventoryItemId")} className={inputCls + " bg-white"}>
                <option value="">Choose an item</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({fmtQty(i.quantity)} {i.unit} in stock)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Quantity{item ? ` (${item.unit})` : ""}</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={set("quantity")} className={inputCls + (tooMuch ? " border-red-400" : "")} />
              {item && qty > 0 && (
                <p className={`text-[11px] mt-1 ${tooMuch ? "text-red-600" : "text-gray-500"}`}>
                  {tooMuch ? `Only ${fmtQty(item.quantity)} ${item.unit} in stock` : `Left after this: ${fmtQty(Number(item.quantity) - qty)} ${item.unit}`}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold">Date</label>
              <input type="date" max={ymd(new Date())} value={form.issuedOn} onChange={set("issuedOn")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold">Issued by (person)</label>
              <input value={form.issuedBy} onChange={set("issuedBy")} maxLength={NAME_MAX} placeholder="Store keeper's name" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold">Issued to <span className="font-normal text-gray-400">(optional)</span></label>
              <input value={form.issuedTo} onChange={set("issuedTo")} maxLength={100} list="inv-out-to" placeholder="e.g. Kitchen" className={inputCls} />
              <datalist id="inv-out-to">{["Kitchen", "Restaurant", "Housekeeping", "Banquet", "Wastage / damaged"].map((x) => <option key={x} value={x} />)}</datalist>
            </div>
            <div>
              <label className="text-xs font-semibold">Note <span className="font-normal text-gray-400">(optional)</span></label>
              <input value={form.note} onChange={set("note")} maxLength={500} className={inputCls} />
            </div>
          </div>
          <button disabled={saving || items.length === 0} className="mt-4 px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : "Issue stock"}
          </button>
        </form>
      )}
      {!canIssue && error && <Notice error={error} />}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <h3 className="font-bold text-gray-900 mr-auto">Inventory Out history</h3>
        <div><label className="block text-xs text-gray-500">From</label><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
        <div><label className="block text-xs text-gray-500">To</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
      </div>

      {totals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {totals.map((t) => (
            <span key={t.name + t.unit} className="text-xs bg-white border rounded-full px-3 py-1"><b>{t.name}</b>: {fmtQty(t.qty)} {t.unit}</span>
          ))}
        </div>
      )}

      <div className="mt-3 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Date</th><th className="p-3">Item</th><th className="p-3">Quantity</th><th className="p-3">Issued by</th><th className="p-3">Issued to</th><th className="p-3">Note</th>{canIssue && <th className="p-3" />}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-gray-400">No stock issued in this period</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{r.issuedOn}</td>
                <td className="p-3 font-semibold">{r.itemName}</td>
                <td className="p-3 whitespace-nowrap">{fmtQty(r.quantity)} {r.unit}</td>
                <td className="p-3">{r.issuedBy}{r.recordedBy && r.recordedBy !== r.issuedBy && <span className="block text-[11px] text-gray-400">entered by {r.recordedBy} · {fmtDateTime(r.createdAt)}</span>}</td>
                <td className="p-3">{r.issuedTo || "-"}</td>
                <td className="p-3 text-xs text-gray-600">{r.note || ""}</td>
                {canIssue && <td className="p-3"><button onClick={() => remove(r)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
