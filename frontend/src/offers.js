import { apiFetch, imgUrl } from "./api";

// Check an offer code against a bill before booking / ordering (the server checks it again when saving).
// kind = "ROOM" (amount = room charges, nights, checkIn) or "FOOD" (amount = food total)
export async function checkOffer({ code, kind, amount, nights = 1, checkIn }) {
  const q = new URLSearchParams({ code: code.trim(), kind, amount: String(amount), nights: String(nights) });
  if (checkIn) q.set("checkIn", checkIn);
  return apiFetch(`/api/offers/check?${q}`);
}

// The offer applied automatically when no code is typed (the server picks the biggest discount that fits).
export async function bestOffer({ kind, amount, nights = 1, checkIn }) {
  const q = new URLSearchParams({ kind, amount: String(amount), nights: String(nights) });
  if (checkIn) q.set("checkIn", checkIn);
  return apiFetch(`/api/offers/best?${q}`);
}

const fmt = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Short lines describing when an offer can be used
export function offerRules(o) {
  const out = [];
  out.push(o.appliesTo === "FOOD" ? "Online food orders" : o.appliesTo === "ALL" ? "Room bookings and online food orders" : "Room bookings");
  if (o.validFrom && o.validTo) out.push(`Valid ${fmt(o.validFrom)} – ${fmt(o.validTo)}`);
  else if (o.validTo) out.push(`Valid till ${fmt(o.validTo)}`);
  else if (o.validFrom) out.push(`Valid from ${fmt(o.validFrom)}`);
  if (o.minNights) out.push(`Stay of ${o.minNights}+ nights`);
  if (o.weekdaysOnly) out.push("Monday–Thursday check-ins");
  if (o.minAmount) out.push(`Minimum bill ₹${Number(o.minAmount).toLocaleString("en-IN")}`);
  if (o.maxDiscount) out.push(`Up to ₹${Number(o.maxDiscount).toLocaleString("en-IN")} off`);
  return out;
}

export const offerImage = (o) => imgUrl(o.imageUrl) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70";
