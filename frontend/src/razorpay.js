import { apiFetch } from "./api";

// Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
// The card / UPI / bank details are typed into Razorpay's own secure window - never into this website.

let config = null;
// { razorpay: true/false, keyId } - is online payment through Razorpay switched on (server has keys)
export function paymentConfig() {
  if (!config) config = apiFetch("/api/payments/config").catch(() => ({ razorpay: false }));
  return config;
}

let script = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!script) {
    script = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { script = null; reject(new Error("Could not load the payment window. Check your internet connection and try again.")); };
      document.body.appendChild(s);
    });
  }
  return script;
}

/**
 * Pays an online food order (tracking code) with Razorpay.
 * Resolves with the updated order + payments once the server has verified the payment,
 * or { cancelled: true } when the customer closes the window. Rejects when the payment fails.
 */
export async function payWithRazorpay(code) {
  await loadCheckout();
  const o = await apiFetch(`/api/orders/online/${code}/razorpay/order`, { method: "POST" });
  return new Promise((resolve, reject) => {
    let failed = null;
    const rzp = new window.Razorpay({
      key: o.keyId,
      order_id: o.orderId,
      amount: o.amount,
      currency: o.currency,
      name: o.name,
      description: o.description,
      prefill: { name: o.customerName || "", contact: o.customerPhone ? `+91${o.customerPhone}` : "" },
      theme: { color: "#1F3B2D" },
      handler: (res) => {
        apiFetch(`/api/orders/online/${code}/razorpay/verify`, { method: "POST", body: JSON.stringify(res) })
          .then(resolve)
          .catch(reject);
      },
      modal: {
        ondismiss: () => (failed ? reject(failed) : resolve({ cancelled: true })),
      },
    });
    rzp.on("payment.failed", (res) => {
      const e = res?.error || {};
      failed = new Error(e.description || "Payment failed. Please try again.");
      apiFetch(`/api/orders/online/${code}/razorpay/failed`, {
        method: "POST",
        body: JSON.stringify({ payment_id: e.metadata?.payment_id || "", reason: e.description || e.reason || "Payment failed" }),
      }).catch(() => {});
    });
    rzp.open();
  });
}
