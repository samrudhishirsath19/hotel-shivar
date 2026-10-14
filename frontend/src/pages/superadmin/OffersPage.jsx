import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiUpload } from "../../api";
import { offerRules, offerImage, APPLIES, appliesTag, isRoomOffer, isRestaurantOffer, isOnlineOffer } from "../../offers";
import { PageTitle, Notice, Badge, Switch, inputCls } from "./ui";

const blank = {
  title: "", description: "", code: "", discountPercent: "20", maxDiscount: "", minAmount: "", minNights: "", minDaysAhead: "",
  days: "ANY", timeFrom: "", timeTo: "", appliesTo: "ROOMS", validFrom: "", validTo: "", usageLimit: "", imageUrl: "", active: true,
};
const today = () => new Date().toISOString().slice(0, 10);
const yearEnd = () => `${new Date().getFullYear()}-12-31`;

// Ready-made starting points for the form
const TEMPLATES = [
  ["🛏️ Room offer", { title: "", appliesTo: "ROOMS", discountPercent: "15", minNights: "2" }],
  ["🍽️ Restaurant offer", { title: "Lunch Special", code: "LUNCH10", appliesTo: "RESTAURANT", discountPercent: "10", timeFrom: "12:00", timeTo: "15:30", maxDiscount: "300" }],
  ["🍹 Weekend dining", { title: "Weekend Feast", code: "WEEKEND15", appliesTo: "FOOD", discountPercent: "15", days: "WEEKENDS", minAmount: "1000" }],
  ["🛵 Online order offer", { title: "Order Online & Save", code: "ONLINE10", appliesTo: "ONLINE", discountPercent: "10", minAmount: "500", maxDiscount: "150" }],
];

const LIST_TABS = [["ALL", "All"], ["ROOMS", "Rooms"], ["RESTAURANT", "Restaurant"], ["ONLINE", "Online food"]];
const inTab = (o, tab) => tab === "ALL" || (tab === "ROOMS" ? isRoomOffer(o) : tab === "RESTAURANT" ? isRestaurantOffer(o) : isOnlineOffer(o));

const str = (v) => (v == null ? "" : String(v));
const toForm = (o) => ({
  title: str(o.title), description: str(o.description), code: str(o.code), discountPercent: str(o.discountPercent),
  maxDiscount: str(o.maxDiscount), minAmount: str(o.minAmount), minNights: str(o.minNights), minDaysAhead: str(o.minDaysAhead),
  days: o.weekdaysOnly ? "WEEKDAYS" : o.weekendsOnly ? "WEEKENDS" : "ANY",
  timeFrom: str(o.timeFrom).slice(0, 5), timeTo: str(o.timeTo).slice(0, 5),
  appliesTo: o.appliesTo || "ROOMS", validFrom: str(o.validFrom), validTo: str(o.validTo), usageLimit: str(o.usageLimit),
  imageUrl: str(o.imageUrl), active: o.active !== false,
});
const num = (v) => (v === "" || v == null ? null : Number(v));

// The request body the backend expects (also used for the quick on/off switch)
const toBody = (f) => {
  const rooms = ["ROOMS", "ALL"].includes(f.appliesTo);
  const food = f.appliesTo !== "ROOMS";
  return {
    title: f.title.trim(), description: f.description.trim(), code: f.code.trim().toUpperCase(),
    discountPercent: num(f.discountPercent), maxDiscount: num(f.maxDiscount), minAmount: num(f.minAmount),
    minNights: rooms ? num(f.minNights) : null, minDaysAhead: rooms ? num(f.minDaysAhead) : null,
    weekdaysOnly: f.days === "WEEKDAYS", weekendsOnly: f.days === "WEEKENDS",
    timeFrom: food && f.timeFrom ? f.timeFrom : null, timeTo: food && f.timeTo ? f.timeTo : null,
    appliesTo: f.appliesTo, validFrom: f.validFrom || null, validTo: f.validTo || null,
    usageLimit: num(f.usageLimit), imageUrl: f.imageUrl || null, active: !!f.active,
  };
};

// Validity shown in the table
function statusOf(o) {
  if (!o.active) return ["Off", "bg-gray-200 text-gray-600"];
  const t = today();
  if (o.validTo && o.validTo < t) return ["Expired", "bg-red-100 text-red-700"];
  if (o.validFrom && o.validFrom > t) return ["Scheduled", "bg-amber-100 text-amber-800"];
  if (o.usageLimit && (o.usedCount || 0) >= o.usageLimit) return ["Used up", "bg-red-100 text-red-700"];
  if (!o.code) return ["No code", "bg-red-100 text-red-700"];
  return ["Live", "bg-green-100 text-green-700"];
}

const Section = ({ title, hint, children }) => (
  <fieldset className="md:col-span-2 border rounded-xl p-4 grid gap-4 md:grid-cols-2">
    <legend className="px-2 text-sm font-bold text-gray-900">{title}</legend>
    {hint && <p className="md:col-span-2 -mt-2 text-xs text-gray-500">{hint}</p>}
    {children}
  </fieldset>
);

// Super admin (or anyone given "Manage offers"): room, restaurant and online food offers.
export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => apiFetch("/api/offers").then((d) => setOffers(d || [])).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const flash = (m) => { setOk(m); setTimeout(() => setOk(""), 2500); };
  const reset = () => { setForm(blank); setEditId(null); };
  const applyTemplate = (t) => { setEditId(null); setForm({ ...blank, validFrom: today(), validTo: yearEnd(), ...t }); };

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
    if (!form.code.trim()) { setError("Give the offer a code - guests type it, and the billing desk picks it from a list."); return; }
    if (form.validFrom && form.validTo && form.validTo < form.validFrom) { setError("'Valid till' must be on or after 'Valid from'."); return; }
    if (!!form.timeFrom !== !!form.timeTo) { setError("Give both the start and end time, or neither."); return; }
    if (form.timeFrom && form.timeTo <= form.timeFrom) { setError("The end time must be after the start time."); return; }
    setBusy(true);
    try {
      await apiFetch(editId ? `/api/offers/${editId}` : "/api/offers", { method: editId ? "PUT" : "POST", body: JSON.stringify(toBody(form)) });
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
      await apiFetch(`/api/offers/${o.id}`, { method: "PUT", body: JSON.stringify(toBody({ ...toForm(o), active })) });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (o) => {
    if (!window.confirm(`Delete the offer "${o.title}"? Bookings and bills that used it keep their discount.`)) return;
    try {
      await apiFetch(`/api/offers/${o.id}`, { method: "DELETE" });
      if (editId === o.id) reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const rooms = ["ROOMS", "ALL"].includes(form.appliesTo);
  const food = form.appliesTo !== "ROOMS";
  const shown = offers.filter((o) => inTab(o, tab));

  return (
    <div>
      <PageTitle title="Offers" sub="Room, restaurant and online food offers. The discount is taken off before GST and shown on the bill as “Offer applied”." />
      <Notice error={error} ok={ok} />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Start from:</span>
        {TEMPLATES.map(([label, t]) => (
          <button key={label} type="button" onClick={() => applyTemplate(t)} className="text-xs font-semibold border bg-white rounded-full px-3 py-1.5 hover:bg-gray-50">{label}</button>
        ))}
      </div>

      <form onSubmit={save} className="mt-4 bg-white rounded-xl border p-5 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 font-bold text-gray-900">{editId ? `Edit offer #${editId}` : "New offer"}</h2>

        <div className="md:col-span-2">
          <p className="text-sm">Where can it be used?</p>
          <div className="mt-1 grid gap-2 sm:grid-cols-3 lg:grid-cols-5" role="radiogroup" aria-label="Applies to">
            {APPLIES.map(([v, label, tag]) => (
              <label key={v} className={`cursor-pointer border rounded-lg px-3 py-2 text-xs ${form.appliesTo === v ? "border-[#1F3B2D] bg-[#F3F5F1] ring-1 ring-[#1F3B2D]" : ""}`}>
                <input type="radio" name="appliesTo" value={v} checked={form.appliesTo === v} onChange={set("appliesTo")} className="sr-only" />
                <span className="block font-bold text-gray-900">{tag}</span>
                <span className="block text-gray-500">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="text-sm">Title
          <input value={form.title} onChange={set("title")} placeholder={food && !rooms ? "Lunch Special" : "Monsoon Escape"} className={inputCls} />
        </label>
        <label className="text-sm">Code (guests type it / billing picks it)
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) }))}
            placeholder={food && !rooms ? "LUNCH10" : "MONSOON20"} className={inputCls + " uppercase"} />
        </label>
        <label className="text-sm md:col-span-2">Description
          <textarea value={form.description} onChange={set("description")} rows={2} className={inputCls} />
        </label>

        <Section title="Discount and validity">
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
          <label className="text-sm">{rooms && !food ? "Check-in days" : "Days"}
            <select value={form.days} onChange={set("days")} className={inputCls + " bg-white"}>
              <option value="ANY">Any day</option>
              <option value="WEEKDAYS">Weekdays only (Mon–Thu)</option>
              <option value="WEEKENDS">Weekends only (Fri–Sun)</option>
            </select>
          </label>
        </Section>

        {rooms && (
          <Section title="🛏️ Room settings" hint="Applied automatically to website bookings that qualify; reception can also apply it to a booking.">
            <label className="text-sm">Minimum nights <span className="text-gray-400">(optional)</span>
              <input type="number" min="1" max="60" value={form.minNights} onChange={set("minNights")} className={inputCls} />
            </label>
            <label className="text-sm">Book at least … days before check-in <span className="text-gray-400">(early bird)</span>
              <input type="number" min="1" max="365" value={form.minDaysAhead} onChange={set("minDaysAhead")} placeholder="e.g. 30" className={inputCls} />
            </label>
          </Section>
        )}

        {food && (
          <Section title="🍽️ Restaurant & food settings"
            hint={form.appliesTo === "ONLINE" ? "Applied automatically to online orders that qualify." : "At the restaurant the billing desk applies it before printing the bill. Online orders get it automatically."}>
            <div className="grid grid-cols-2 gap-3 md:col-span-2 max-w-md">
              <label className="text-sm">Valid from time <span className="text-gray-400">(optional)</span>
                <input type="time" value={form.timeFrom} onChange={set("timeFrom")} className={inputCls} />
              </label>
              <label className="text-sm">Until
                <input type="time" value={form.timeTo} onChange={set("timeTo")} className={inputCls} />
              </label>
            </div>
            <p className="md:col-span-2 text-xs text-gray-500 -mt-2">Use the time window for lunch deals or happy hours, e.g. 12:00 – 15:30.</p>
          </Section>
        )}

        <div className="text-sm">
          Image <span className="text-gray-400">(optional)</span>
          <div className="mt-1 flex items-center gap-3">
            <img src={offerImage(form)} alt="" className="h-12 w-20 object-cover rounded" />
            <label className="border rounded-lg px-3 py-2 cursor-pointer bg-white">
              {uploading ? "Uploading..." : form.imageUrl ? "Change image" : "Upload image"}
              <input type="file" accept="image/*" onChange={upload} className="hidden" disabled={uploading} />
            </label>
            {form.imageUrl && <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))} className="text-red-600 text-xs">Remove</button>}
          </div>
        </div>
        <label className="text-sm flex items-center gap-2">
          <Switch on={!!form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Offer is on" />
          Offer is on (shown on the website and usable)
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button disabled={busy || uploading} className="bg-[#1F3B2D] text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-60">
            {busy ? "Saving..." : editId ? "Save changes" : "Create offer"}
          </button>
          {(editId || form !== blank) && <button type="button" onClick={reset} className="border px-5 py-2 rounded-lg">{editId ? "Cancel" : "Clear"}</button>}
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {LIST_TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${tab === id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white"}`}>
            {label} <span className="opacity-70">({offers.filter((o) => inTab(o, id)).length})</span>
          </button>
        ))}
      </div>
      <div className="mt-3 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="p-3">Offer</th><th className="p-3">For</th><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Rules</th><th className="p-3">Used</th><th className="p-3">Status</th><th className="p-3">On</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan="9" className="p-4 text-center text-gray-500">No offers here yet.</td></tr>}
            {shown.map((o) => {
              const [label, cls] = statusOf(o);
              return (
                <tr key={o.id} className="border-t align-top">
                  <td className="p-3 font-semibold">{o.title}</td>
                  <td className="p-3 whitespace-nowrap text-xs">{appliesTag(o)}</td>
                  <td className="p-3 font-mono">{o.code || "-"}</td>
                  <td className="p-3 whitespace-nowrap">{o.discountPercent ? `${o.discountPercent}%` : "-"}</td>
                  <td className="p-3 text-xs text-gray-600">{offerRules(o).slice(1).join(" · ") || "No extra rules"}</td>
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
      <p className="text-xs text-gray-500 mt-2"><Badge on yes="Live" /> offers appear on the website's Offers page and can be applied.</p>
    </div>
  );
}
