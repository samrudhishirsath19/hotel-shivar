import { useEffect, useState } from "react";
import { apiFetch } from "./api";

// GST settings from the backend (super admin manages them). Cached for the whole page.
let cache = null;
let pending = null;
export function loadGst(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!pending || force) {
    pending = apiFetch("/api/gst")
      .then((s) => { cache = s; return s; })
      .finally(() => { pending = null; });
  }
  return pending;
}
export function useGst() {
  const [gst, setGst] = useState(cache);
  useEffect(() => {
    let alive = true;
    loadGst().then((s) => alive && setGst(s)).catch(() => {});
    return () => { alive = false; };
  }, []);
  return gst;
}

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Same sum as the backend (GstService.calculate): CGST and SGST are each half the rate, rounded to the paisa.
// Only for showing an ESTIMATE before something is saved - saved orders and bookings carry their own GST.
export function calcTax(taxable, rate) {
  const base = r2(taxable);
  const half = r2((base * Number(rate || 0)) / 200);
  return { taxable: base, rate: Number(rate || 0), cgst: half, sgst: half, tax: r2(half * 2), total: r2(base + half * 2) };
}
export const foodRate = (s) => (s && s.enabled ? Number(s.foodRate) : 0);
export const roomRate = (s, pricePerNight) =>
  !s || !s.enabled ? 0 : Number(pricePerNight) <= Number(s.roomThreshold) ? Number(s.roomRateLow) : Number(s.roomRateHigh);

// Saved order / booking -> its GST figures (null for records saved before GST existed).
export const taxOf = (x, taxableField = "total") =>
  x && x.grandTotal != null
    ? { taxable: Number(x[taxableField] ?? 0), rate: Number(x.gstRate), cgst: Number(x.cgstAmount), sgst: Number(x.sgstAmount), tax: Number(x.taxAmount), total: Number(x.grandTotal) }
    : null;

// What the guest pays: with GST when it was worked out, otherwise the plain amount.
export const payable = (x) => Number(x?.amountPayable ?? x?.grandTotal ?? x?.total ?? 0);

export const pct = (n) => `${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
// rupees with paise (for bills and invoices)
export const inr2 = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
