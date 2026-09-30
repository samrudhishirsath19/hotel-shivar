// Online (delivery) order steps and payment states - must match the backend enums
// (OnlineOrderStatus.java, PaymentStatus.java, PaymentMethod.java).

export const ONLINE_STEPS = [
  { id: "PLACED", label: "Placed", icon: "📝" },
  { id: "CONFIRMED", label: "Confirmed", icon: "✅" },
  { id: "PREPARING", label: "Preparing", icon: "🍳" },
  { id: "READY", label: "Ready", icon: "🛍️" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🛵" },
  { id: "DELIVERED", label: "Delivered", icon: "🏠" },
];

export const onlineLabel = (s) => (s === "CANCELLED" ? "Cancelled" : ONLINE_STEPS.find((x) => x.id === s)?.label || s || "-");

// Orders saved before delivery statuses existed have none: work it out from the older fields.
export const onlineStatusOf = (o) => {
  if (o.onlineStatus) return o.onlineStatus;
  if (o.status === "CANCELLED") return "CANCELLED";
  if (o.status === "PAID") return "DELIVERED";
  if (o.status === "PENDING") return "PLACED";
  return o.kitchenStatus === "READY" || o.kitchenStatus === "SENT_TO_BILLING" ? "READY" : "PREPARING";
};

// The next step staff can move an order to (null = nothing to do). PLACED -> CONFIRMED needs payment.
export const NEXT_STEP = {
  PLACED: { to: "CONFIRMED", label: "Confirm order" },
  CONFIRMED: { to: "PREPARING", label: "Start preparing" },
  PREPARING: { to: "READY", label: "Mark ready" },
  READY: { to: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  OUT_FOR_DELIVERY: { to: "DELIVERED", label: "Mark delivered" },
};

export const PAYMENT_STATUS = {
  PENDING: { label: "Payment Pending", cls: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Paid", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "Payment Failed", cls: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Refunded", cls: "bg-purple-100 text-purple-700" },
};

export const PAYMENT_METHODS = {
  UPI: "UPI",
  CARD: "Card",
  NET_BANKING: "Net banking",
  WALLET: "Wallet",
  CASH_ON_DELIVERY: "Cash on delivery",
  CASH: "Cash",
};
export const methodLabel = (m) => PAYMENT_METHODS[m] || m || "-";

// Can staff confirm this placed order? Only when paid, or cash on delivery (old orders: always).
export const canConfirm = (o) =>
  !o.paymentStatus || o.paymentStatus === "PAID" || (o.paymentMethod === "CASH_ON_DELIVERY" && o.paymentStatus === "PENDING");
