import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { loadGst, calcTax, inr2, pct } from "../../gst";
import { PageTitle, Notice, inputCls } from "./ui";

// Rates in force since 22 Sep 2025 (GST Notification 15/2025-CT(Rate))
const CURRENT_LAW = { foodRate: "5", roomRateLow: "5", roomRateHigh: "18", roomThreshold: "7500" };

const toForm = (s) => ({
  enabled: !!s.enabled,
  foodRate: String(Number(s.foodRate)),
  roomRateLow: String(Number(s.roomRateLow)),
  roomRateHigh: String(Number(s.roomRateHigh)),
  roomThreshold: String(Number(s.roomThreshold)),
  gstin: s.gstin || "",
  legalName: s.legalName || "",
  address: s.address || "",
  sacFood: s.sacFood || "",
  sacRoom: s.sacRoom || "",
});

function Rate({ label, help, value, onChange, id }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold">{label}</label>
      <div className="relative">
        <input id={id} type="number" min="0" max="28" step="0.01" required value={value} onChange={onChange} className={inputCls + " pr-8"} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-sm text-gray-500">%</span>
      </div>
      {help && <p className="text-[11px] text-gray-500 mt-1">{help}</p>}
    </div>
  );
}

// Super admin: GST rates and the details printed on tax invoices.
export default function GstSettingsPage() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGst(true).then((s) => { setForm(toForm(s)); setSaved(s); }).catch((e) => setError(e.message));
  }, []);

  if (!form) return <><PageTitle title="GST Settings" />{error ? <Notice error={error} /> : <p className="text-sm text-gray-500">Loading...</p>}</>;

  const set = (k) => (e) => { const v = e.target.type === "checkbox" ? e.target.checked : e.target.value; setForm((f) => ({ ...f, [k]: v })); };
  const half = (v) => pct(Number(v || 0) / 2);
  const isCurrentLaw = Object.entries(CURRENT_LAW).every(([k, v]) => Number(form[k]) === Number(v));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (Number(form.roomRateHigh) < Number(form.roomRateLow)) { setError("The room rate above the limit should not be lower than the rate up to the limit."); return; }
    setSaving(true);
    try {
      const s = await apiFetch("/api/admin/gst", {
        method: "PUT",
        body: JSON.stringify({
          enabled: form.enabled,
          foodRate: Number(form.foodRate),
          roomRateLow: Number(form.roomRateLow),
          roomRateHigh: Number(form.roomRateHigh),
          roomThreshold: Number(form.roomThreshold),
          gstin: form.gstin.trim().toUpperCase(),
          legalName: form.legalName.trim(),
          address: form.address.trim(),
          sacFood: form.sacFood.trim(),
          sacRoom: form.sacRoom.trim(),
        }),
      });
      setSaved(s);
      setForm(toForm(s));
      await loadGst(true); // refresh the copy the rest of the app uses
      setOk("✅ GST settings saved. They apply to new orders, bills sent to billing and new bookings - paid bills keep the GST they were charged.");
      setTimeout(() => setOk(""), 6000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // worked examples with the values in the form
  const food = calcTax(1000, form.enabled ? form.foodRate : 0);
  const low = calcTax(Number(form.roomThreshold || 0), form.enabled ? form.roomRateLow : 0);
  const highPrice = Number(form.roomThreshold || 0) + 500;
  const high = calcTax(highPrice, form.enabled ? form.roomRateHigh : 0);

  return (
    <div className="max-w-4xl">
      <PageTitle title="GST Settings" sub="GST is added automatically to restaurant bills, online orders and room bookings, and shown on every bill and invoice." />

      <form onSubmit={save} className="space-y-6">
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={form.enabled} onChange={set("enabled")} className="w-5 h-5" />
              Charge GST on bills
            </label>
            {!isCurrentLaw && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, ...CURRENT_LAW }))} className="px-4 py-1.5 rounded-full border text-xs font-bold text-[#1F3B2D]">
                Use current GST rates (5% / 5% / 18%)
              </button>
            )}
          </div>
          {!form.enabled && <p className="mt-2 text-xs text-orange-700">GST is off: new bills will have no GST.</p>}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 ${form.enabled ? "" : "opacity-50"}`}>
            <div className="md:col-span-2 rounded-lg bg-gray-50 px-4 py-3">
              <h3 className="font-bold text-sm text-gray-900">🍽️ Restaurant food &amp; drinks</h3>
              <p className="text-xs text-gray-500">Table, room-service and online orders.</p>
              <div className="mt-3 max-w-xs">
                <Rate id="gst-food" label="Food GST" value={form.foodRate} onChange={set("foodRate")}
                  help={`= ${half(form.foodRate)} CGST + ${half(form.foodRate)} SGST`} />
              </div>
            </div>

            <div className="md:col-span-2 rounded-lg bg-gray-50 px-4 py-3">
              <h3 className="font-bold text-sm text-gray-900">🛏️ Hotel / lodge rooms</h3>
              <p className="text-xs text-gray-500">The rate is chosen by the price of one room for one night (not the total of the stay).</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="gst-limit" className="text-xs font-semibold">Price limit per room per night</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-sm text-gray-500">₹</span>
                    <input id="gst-limit" type="number" min="1" step="1" required value={form.roomThreshold} onChange={set("roomThreshold")} className={inputCls + " pl-7"} />
                  </div>
                </div>
                <Rate id="gst-room-low" label={`Up to ${inr2(form.roomThreshold)}`} value={form.roomRateLow} onChange={set("roomRateLow")}
                  help={`= ${half(form.roomRateLow)} CGST + ${half(form.roomRateLow)} SGST`} />
                <Rate id="gst-room-high" label={`Above ${inr2(form.roomThreshold)}`} value={form.roomRateHigh} onChange={set("roomRateHigh")}
                  help={`= ${half(form.roomRateHigh)} CGST + ${half(form.roomRateHigh)} SGST`} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">Details on tax invoices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label htmlFor="gst-in" className="text-xs font-semibold">GSTIN</label>
              <input id="gst-in" value={form.gstin} onChange={set("gstin")} maxLength={15} placeholder="e.g. 27ABCDE1234F1Z5" className={inputCls + " uppercase"} />
            </div>
            <div>
              <label htmlFor="gst-name" className="text-xs font-semibold">Business name</label>
              <input id="gst-name" value={form.legalName} onChange={set("legalName")} maxLength={150} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="gst-addr" className="text-xs font-semibold">Address</label>
              <input id="gst-addr" value={form.address} onChange={set("address")} maxLength={300} className={inputCls} />
            </div>
            <div>
              <label htmlFor="gst-sac-f" className="text-xs font-semibold">SAC code - restaurant</label>
              <input id="gst-sac-f" value={form.sacFood} onChange={set("sacFood")} maxLength={8} inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label htmlFor="gst-sac-r" className="text-xs font-semibold">SAC code - rooms</label>
              <input id="gst-sac-r" value={form.sacRoom} onChange={set("sacRoom")} maxLength={8} inputMode="numeric" className={inputCls} />
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">How bills will look</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
            {[
              ["Food bill of ₹1,000", food],
              [`Room at ${inr2(form.roomThreshold)} / night`, low],
              [`Room at ${inr2(highPrice)} / night`, high],
            ].map(([label, t]) => (
              <div key={label} className="rounded-lg border px-3 py-2">
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-600 mt-1">CGST {pct(t.rate / 2)}: {inr2(t.cgst)} · SGST {pct(t.rate / 2)}: {inr2(t.sgst)}</p>
                <p className="font-bold text-[#1F3B2D] mt-1">Total {inr2(t.total)}</p>
              </div>
            ))}
          </div>
        </section>

        <Notice error={error} ok={ok} />
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={saving} className="px-6 py-2.5 rounded-full bg-[#1F3B2D] text-white text-sm font-bold disabled:opacity-60">
            {saving ? "Saving..." : "Save GST settings"}
          </button>
          {saved?.updatedAt && <span className="text-xs text-gray-400">Last changed {new Date(saved.updatedAt).toLocaleString("en-IN")}</span>}
        </div>
      </form>

      <div className="mt-8 text-xs text-gray-500 space-y-1 border-t pt-4">
        <p><b>How GST is applied:</b> menu and room prices are without GST. GST is worked out once when an order or booking is made (and again with the latest settings when a table bill is sent to billing), stored with it, and printed on the bill - it is never added twice. Paid bills never change.</p>
        <p><b>Current GST rates (since 22 Sep 2025):</b> restaurant service 5%; rooms up to ₹7,500 per night 5%, above ₹7,500 18%. A restaurant inside a hotel that charges more than ₹7,500 for a room may count as “specified premises” and charge 18% on food - check with your CA and change the food rate here if it applies.</p>
      </div>
    </div>
  );
}
