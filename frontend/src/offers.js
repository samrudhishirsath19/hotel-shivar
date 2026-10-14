import { apiFetch, imgUrl } from "./api";

// Check an offer code against a bill before booking / ordering (the server checks it again when saving).
// kind = "ROOM" (amount = room charges, nights, checkIn), "FOOD" / "ONLINE" (online order total)
// or "RESTAURANT" (restaurant bill total)
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

// Where an offer can be used (same values as the backend's Offer.AppliesTo): [value, label, short tag]
export const APPLIES = [
  ["ROOMS", "Room bookings", "🛏️ Stay"],
  ["RESTAURANT", "Restaurant bills (dine-in & room service)", "🍽️ Restaurant"],
  ["ONLINE", "Online food orders", "🛵 Online food"],
  ["FOOD", "Restaurant + online food", "🍽️ Food"],
  ["ALL", "Everything (rooms + food)", "🛏️ + 🍽️"],
];
const applies = (o) => o.appliesTo || "ROOMS";
export const isRoomOffer = (o) => ["ROOMS", "ALL"].includes(applies(o));
export const isRestaurantOffer = (o) => ["RESTAURANT", "FOOD", "ALL"].includes(applies(o));
export const isOnlineOffer = (o) => ["ONLINE", "FOOD", "ALL"].includes(applies(o));
export const isFoodOffer = (o) => isRestaurantOffer(o) || isOnlineOffer(o);
const entry = (o) => APPLIES.find(([v]) => v === applies(o)) || APPLIES[0];
export const appliesLabel = (o) => entry(o)[1];
export const appliesTag = (o) => entry(o)[2];

const fmt = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const hm = (t) => {
  if (!t) return "";
  const [h, m] = String(t).split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};

// Short lines describing when an offer can be used
export function offerRules(o) {
  const out = [appliesLabel(o)];
  if (o.validFrom && o.validTo) out.push(`Valid ${fmt(o.validFrom)} – ${fmt(o.validTo)}`);
  else if (o.validTo) out.push(`Valid till ${fmt(o.validTo)}`);
  else if (o.validFrom) out.push(`Valid from ${fmt(o.validFrom)}`);
  if (o.minNights) out.push(`Stay of ${o.minNights}+ nights`);
  if (o.minDaysAhead) out.push(`Book ${o.minDaysAhead}+ days ahead`);
  const roomOnly = isRoomOffer(o) && !isFoodOffer(o);
  if (o.weekdaysOnly) out.push(roomOnly ? "Monday–Thursday check-ins" : "Monday–Thursday");
  if (o.weekendsOnly) out.push(roomOnly ? "Friday–Sunday check-ins" : "Friday–Sunday");
  if (o.timeFrom && o.timeTo) out.push(`${hm(o.timeFrom)} – ${hm(o.timeTo)}`);
  if (o.minAmount) out.push(`Minimum bill ₹${Number(o.minAmount).toLocaleString("en-IN")}`);
  if (o.maxDiscount) out.push(`Up to ₹${Number(o.maxDiscount).toLocaleString("en-IN")} off`);
  return out;
}

export const offerImage = (o) =>
  imgUrl(o.imageUrl) ||
  (isRoomOffer(o)
    ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70"
    : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=70");
