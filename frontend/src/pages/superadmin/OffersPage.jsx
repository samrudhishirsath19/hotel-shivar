import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiUpload } from "../../api";
import { offerRules, offerImage } from "../../offers";
import { PageTitle, Notice, Badge, Switch, inputCls } from "./ui";

const blank = {
  title: "", description: "", code: "", discountPercent: "20", maxDiscount: "", minAmount: "", minNights: "",
  weekdaysOnly: false, appliesTo: "ROOMS", validFrom: "", validTo: "", usageLimit: "", imageUrl: "", active: true,
};
const APPLIES = [["ROOMS", "Room bookings"], ["FOOD", "Online food orders"], ["ALL", "Both"]];
const today = () => new Date().toISOString().slice(0, 10);

const toForm = (o) => Object.fromEntries(Object.keys(blank).map((k) => [k, o[k] ?? (typeof blank[k] === "boolean" ? blank[k] : "")]).map(([k, v]) => [k, typeof v === "number" ? String(v) : v]));
const num = (v) => (v === "" || v == null ? null : Number(v));

// Validity shown in the table
function statusOf(o) {
  if (!o.active) return ["Off", "bg-gray-200 text-gray-600"];
  const t = today();
  if (o.validTo && o.validTo < t) return ["Expired", "bg-red-100 text-red-700"];
  if (o.validFrom && o.validFrom > t) return ["Scheduled", "bg-amber-100 text-amber-800"];
  if (o.usageLimit && (o.usedCount || 0) >= o.usageLimit) return ["Used up", "bg-red-100 text-red-700"];
  return ["Live", "bg-green-100 text-green-700"];
}

// Super admin (or anyone given "Manage offers"): create offers, choose where they apply and how long they run.
export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => apiFetch("/api/offers").then((d) => setOffers(d || [])).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const flash = (m) => { setOk(m); setTimeout(() => setOk(""), 2500); };
  const reset = () => { setForm(blank); setEditId(null); };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { url } = await apiUpload("/api/admin/uploads", file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (form.validFrom && form.validTo && form.validTo < form.validFrom) { setError("'Valid till' must be on or after 'Valid from'."); return; }
    if (!form.code.trim()) { setError("Give the offer a code - guests type it when booking or ordering."); return; }
    const body = {
      title: form.title.trim(), description: form.description.trim(), code: form.code.trim().toUpperCase(),
      discountPercent: num(form.discountPercent), maxDiscount: num(form.maxDiscount), minAmount: num(form.minAmount),
      minNights: form.appliesTo === "FOOD" ? null : num(form.minNights),
      weekdaysOnly: form.appliesTo === "FOOD" ? false : !!form.weekdaysOnly,
      appliesTo: form.appliesTo, validFrom: form.validFrom || null, validTo: form.validTo || null,
      usageLimit: num(form.usageLimit), imageUrl: form.imageUrl || null, active: !!form.active,
    };
    setBusy(true);
    try {
      await apiFetch(editId ? `/api/offers/${editId}` : "/api/offers", { method: editId ? "PUT" : "POST", body: JSON.stringify(body) });
      flash(editId ? "Offer updated" : "Offer created");
      reset();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (o, active) => {
    setError("");
    try {
      await apiFetch(`/api/offers/${o.id}`, { method: "PUT", body: JSON.stringify({ ...o, active }) });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (o) => {
    if (!window.confirm(`Delete the offer "${o.title}"? Bookings and orders that used it keep their discount.`)) return;
    try {
      await apiFetch(`/api/offers/${o.id}`, { method: "DELETE" });
      if (editId === o.id) reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const food = form.appliesTo === "FOOD";

  return (
    <div>
      <PageTitle title="Offers" sub="Discount codes for the website. The discount is taken off before GST; the Offers page shows only live offers." />
      <Notice error={error} ok={ok} />

      <form onSubmit={save} className="mt-4 bg-white rounded-xl border p-5 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 font-bold text-gray-900">{editId ? `Edit offer #${editId}` : "New offer"}</h2>
        <label className="text-sm">Title
          <input value={form.title} onChange={set("title")} placeholder="Monsoon Escape" className={inputCls} />
        </label>
        <label className="text-sm">Code (guests type this)
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) }))}
            placeholder="MONSOON20" className={inputCls + " uppercase"} />
        </label>
        <label className="text-sm md:col-span-2">Description
          <textarea value={form.description} onChange={set("description")} rows={2} className={inputCls} />
        </label>
        <label className="text-sm">Applies to
          <select value={form.appliesTo} onChange={set("appliesTo")} className={inputCls + " bg-white"}>
            {APPLIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Discount %
            <input type="number" min="1" max="90" value={form.discountPercent} onChange={set("discountPercent")} className={inputCls} />
          </label>
          <label className="text-sm">Max discount ₹ <span className="text-gray-400">(optional)</span>
            <input type="number" min="1" value={form.maxDiscount} onChange={set("maxDiscount")} className={inputCls} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Valid from
            <input type="date" value={form.validFrom} onChange={set("validFrom")} className={inputCls} />
          </label>
          <label className="text-sm">Valid till
            <input type="date" min={form.validFrom || undefined} value={form.validTo} onChange={set("validTo")} className={inputCls} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Minimum bill ₹ <span className="text-gray-400">(optional)</span>
            <input type="number" min="0" value={form.minAmount} onChange={set("minAmount")} className={inputCls} />
          </label>
          <label className="text-sm">Usage limit <span className="text-gray-400">(optional)</span>
            <input type="number" min="1" value={form.usageLimit} onChange={set("usageLimit")} placeholder="Unlimited" className={inputCls} />
          </label>
        </div>
        {!food && (
          <div className="grid grid-cols-2 gap-3 items-end">
            <label className="text-sm">Minimum nights <span className="text-gray-400">(optional)</span>
              <input type="number" min="1" max="60" value={form.minNights} onChange={set("minNights")} className={inputCls} />
            </label>
            <label className="text-sm flex items-center gap-2 pb-2">
              <Switch on={!!form.weekdaysOnly} onChange={(v) => setForm((f) => ({ ...f, weekdaysOnly: v }))} label="Weekday check-ins only" />
              Mon–Thu check-ins only
            </label>
          </div>
        )}
        <div className="text-sm">
          Image <span className="text-gray-400">(optional)</span>
          <div className="mt-1 flex items-center gap-3">
            {form.imageUrl && <img src={offerImage(form)} alt="" className="h-12 w-20 object-cover rounded" />}
            <label className="border rounded-lg px-3 py-2 cursor-pointer bg-white">
              {uploading ? "Uploading..." : form.imageUrl ? "Change image" : "Upload image"}
              <input type="file" accept="image/*" onChange={upload} className="hidden" disabled={uploading} />
            </label>
            {form.imageUrl && <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))} className="text-red-600 text-xs">Remove</button>}
          </div>
        </div>
        <label className="text-sm flex items-center gap-2 md:col-span-2">
          <Switch on={!!form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Offer is on" />
          Offer is on (shown on the website and accepted at booking / ordering)
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button disabled={busy || uploading} className="bg-[#1F3B2D] text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-60">
            {busy ? "Saving..." : editId ? "Save changes" : "Create offer"}
          </button>
          {editId && <button type="button" onClick={reset} className="border px-5 py-2 rounded-lg">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="p-3">Offer</th><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Rules</th><th className="p-3">Used</th><th className="p-3">Status</th><th className="p-3">On</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {offers.length === 0 && <tr><td colSpan="8" className="p-4 text-center text-gray-500">No offers yet.</td></tr>}
            {offers.map((o) => {
              const [label, cls] = statusOf(o);
              return (
                <tr key={o.id} className="border-t align-top">
                  <td className="p-3 font-semibold">{o.title}</td>
                  <td className="p-3 font-mono">{o.code || "-"}</td>
                  <td className="p-3 whitespace-nowrap">{o.discountPercent ? `${o.discountPercent}%` : "-"}</td>
                  <td className="p-3 text-xs text-gray-600">{offerRules(o).join(" · ")}</td>
                  <td className="p-3 whitespace-nowrap">{o.usedCount || 0}{o.usageLimit ? ` / ${o.usageLimit}` : ""}</td>
                  <td className="p-3"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${cls}`}>{label}</span></td>
                  <td className="p-3"><Switch on={!!o.active} onChange={(v) => toggle(o, v)} label={`${o.title} on`} /></td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => { setForm(toForm(o)); setEditId(o.id); window.scrollTo(0, 0); }} className="text-[#B8893C] font-semibold mr-3">Edit</button>
                    <button onClick={() => remove(o)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2"><Badge on yes="Live" /> offers appear on the website's Offers page.</p>
    </div>
  );
}
