import { onlineStatusOf } from "./orderStatus";
import { fmtTime } from "./dates";

// Where an online order is with its delivery boy - shown to staff, the delivery boy and the customer.
export function deliveryStage(o) {
  const st = onlineStatusOf(o);
  if (st === "CANCELLED") return { id: "cancelled", label: "Cancelled", cls: "bg-gray-200 text-gray-600" };
  if (st === "DELIVERED") return { id: "delivered", label: `Delivered${o.deliveredAt ? " " + fmtTime(o.deliveredAt) : ""}`, cls: "bg-green-100 text-green-700" };
  if (!o.deliveryBoyId) return { id: "unassigned", label: "Not assigned", cls: "bg-red-100 text-red-700" };
  if (st === "OUT_FOR_DELIVERY") return { id: "out", label: `Accepted - on the way${o.pickedUpAt ? " since " + fmtTime(o.pickedUpAt) : ""}`, cls: "bg-blue-100 text-blue-700" };
  if (st === "READY" && !o.dispatchedAt) return { id: "dispatch", label: "Ready - waiting for dispatch", cls: "bg-orange-100 text-orange-800" };
  if (st === "READY") return { id: "waiting", label: "Dispatched - waiting for him to accept", cls: "bg-yellow-100 text-yellow-800" };
  return { id: "early", label: "Assigned - food being prepared", cls: "bg-gray-100 text-gray-700" };
}

// Google Maps search for the delivery address (opens the maps app on a phone)
export const mapsLink = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;
