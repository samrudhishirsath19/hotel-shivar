import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { inr } from "../roles";
import { fmtDateTime } from "../dates";
import { PAYMENT_STATUS, methodLabel, onlineStatusOf, onlineLabel } from "../orderStatus";
import OrderStepper from "../components/OrderStepper";
import { taxOf, payable, inr2, pct } from "../gst";

const PAY_OPTIONS = [
  { id: "UPI", label: "UPI", note: "GPay, PhonePe, Paytm, BHIM" },
  { id: "CARD", label: "Credit / Debit card", note: "Visa, Mastercard, RuPay" },
  { id: "NET_BANKING", label: "Net banking", note: "All major banks" },
  { id: "WALLET", label: "Wallet", note: "Paytm, Amazon Pay, ..." },
  { id: "CASH_ON_DELIVERY", label: "Cash on delivery", note: "Pay when the food arrives" },
];

// Payment step: shown while a placed order is not paid yet (or the last attempt failed).
function PaymentPanel({ data, code, onDone }) {
  const order = data.order;
  const [method, setMethod] = useState(order.paymentMethod && order.paymentMethod !== "CASH" ? order.paymentMethod : "UPI");
  const [upiId, setUpiId] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setError("");
    if (method === "UPI" && !/^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/.test(upiId.trim())) {
      setError("Enter a valid UPI id, e.g. name@okaxis");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`/api/orders/online/${code}/pay`, {
        method: "POST",
        body: JSON.stringify({ method, upiId: method === "UPI" ? upiId.trim() : null, simulateFailure }),
      });
      onDone(res);
      if (res.order.paymentStatus === "FAILED") setError("Payment failed. No money was taken - please try again or choose another method.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cod = method === "CASH_ON_DELIVERY";
  return (
    <section className="bg-white rounded-2xl border-2 border-[#B8893C] p-5">
      <h2 className="font-serif text-xl text-[#1F3B2D]">Complete your payment</h2>
      <p className="text-sm text-gray-600">Your order is confirmed by the restaurant after payment. Amount: <b>{inr2(payable(order))}</b>{order.taxAmount ? " (incl. GST)" : ""}</p>
      {order.paymentStatus === "FAILED" && !error && (
        <p className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">The last payment failed. Please try again.</p>
      )}
      {error && <p role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</p>}

      <div className="mt-4 space-y-2" role="radiogroup" aria-label="Payment method">
        {PAY_OPTIONS.map((p) => (
          <label key={p.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer ${method === p.id ? "border-[#1F3B2D] bg-[#F3F5F1]" : ""}`}>
            <input type="radio" name="pay" value={p.id} checked={method === p.id} onChange={() => setMethod(p.id)} />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{p.label}</span>
              <span className="block text-xs text-gray-500">{p.note}</span>
            </span>
          </label>
        ))}
      </div>

      {method === "UPI" && (
        <div className="mt-3">
          <label className="text-sm font-medium" htmlFor="upi">UPI id</label>
          <input id="upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@okaxis"
            className="mt-1 w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none" />
        </div>
      )}
      {(method === "CARD" || method === "NET_BANKING" || method === "WALLET") && (
        <p className="mt-3 text-xs text-gray-500">You will complete the payment on the secure payment page. Hotel Shivar never sees your card or bank details.</p>
      )}
      {!cod && (
        <label className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
          Test mode: simulate a failed payment
        </label>
      )}

      <button onClick={pay} disabled={busy} className="mt-4 w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-60">
        {busy ? "Processing..." : cod ? "Confirm cash on delivery" : `Pay ${inr2(payable(order))}`}
      </button>
      <p className="mt-2 text-[11px] text-gray-400 text-center">Demo payment gateway - no real money is charged.</p>
    </section>
  );
}

// Public page the customer lands on after ordering: pay, then follow the order until it is delivered.
export default function OrderTrack() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    apiFetch(`/api/orders/track/${encodeURIComponent(code)}`)
      .then((d) => { setData(d); setError(""); })
      .catch((e) => setError(e.message));
  }, [code]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  if (error && !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-red-700">{error}</p>
        <Link to="/restaurant" className="inline-block mt-4 text-[#B8893C] font-semibold">← Back to the menu</Link>
      </div>
    );
  }
  if (!data) return <p className="text-center text-gray-500 py-16">Loading your order...</p>;

  const o = data.order;
  const status = onlineStatusOf(o);
  const needsPayment = o.status === "PENDING" && (o.paymentStatus === "FAILED" || (o.paymentStatus === "PENDING" && o.paymentMethod !== "CASH_ON_DELIVERY"));
  const pay = PAYMENT_STATUS[o.paymentStatus];
  const itemCount = o.lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="bg-[#F3F5F1] min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#1F3B2D]">Order #{o.id}</h1>
            <p className="text-sm text-gray-500">{fmtDateTime(o.createdAt)} · Hotel Shivar, Kamshet</p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-[#1F3B2D] text-white">{onlineLabel(status)}</span>
        </div>

        <section className="bg-white rounded-2xl border p-5">
          <OrderStepper status={status} />
          <p className="mt-4 text-sm text-center text-gray-600">
            {{
              PLACED: needsPayment ? "Please complete the payment so the restaurant can confirm your order." : "Waiting for the restaurant to confirm your order.",
              CONFIRMED: "The restaurant has confirmed your order.",
              PREPARING: "Your food is being prepared.",
              READY: "Your order is packed and will leave soon.",
              OUT_FOR_DELIVERY: "Your order is on the way!",
              DELIVERED: `Delivered${o.deliveredAt ? " at " + fmtDateTime(o.deliveredAt) : ""}. Enjoy your meal!`,
              CANCELLED: o.paymentStatus === "REFUNDED" ? "This order was cancelled. Your payment has been refunded." : "This order was cancelled.",
            }[status]}
          </p>
        </section>

        {needsPayment && <PaymentPanel data={data} code={code} onDone={setData} />}

        <section className="bg-white rounded-2xl border p-5">
          <h2 className="font-bold text-[#1F3B2D]">Delivery details</h2>
          <p className="text-sm mt-2">👤 {o.customerName} · 📞 {o.customerPhone}</p>
          <p className="text-sm text-gray-700 mt-1">📍 {o.deliveryAddress}</p>
          {o.deliveryNote && <p className="text-sm text-gray-500 mt-1">📝 {o.deliveryNote}</p>}
        </section>

        <section className="bg-white rounded-2xl border p-5">
          <h2 className="font-bold text-[#1F3B2D]">Your order ({itemCount} item{itemCount > 1 ? "s" : ""})</h2>
          <table className="w-full text-sm mt-2">
            <tbody>
              {o.lines.map((l) => (
                <tr key={l.menuItemId} className="border-b last:border-0">
                  <td className="py-2">{l.name}</td>
                  <td className="py-2 text-gray-500 text-center whitespace-nowrap">{l.quantity} × {inr(l.unitPrice)}</td>
                  <td className="py-2 text-right">{inr(l.unitPrice * l.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {taxOf(o) && taxOf(o).tax > 0 && (
            <div className="mt-2 pt-2 border-t text-sm space-y-0.5">
              <div className="flex justify-between text-gray-600"><span>Item total</span><span>{inr2(o.total)}</span></div>
              <div className="flex justify-between text-gray-600"><span>CGST @ {pct(o.gstRate / 2)}</span><span>{inr2(o.cgstAmount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>SGST @ {pct(o.gstRate / 2)}</span><span>{inr2(o.sgstAmount)}</span></div>
            </div>
          )}
          <div className="mt-2 pt-2 border-t-2 border-gray-800 flex justify-between font-bold">
            <span>{taxOf(o) ? "To pay (incl. GST)" : "Total"}</span><span className="text-[#B8893C]">{inr2(payable(o))}</span>
          </div>
        </section>

        <section className="bg-white rounded-2xl border p-5 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#1F3B2D]">Payment</h2>
            {pay && <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${pay.cls}`}>{pay.label}</span>}
          </div>
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-gray-700">
            <dt className="text-gray-500">Method</dt><dd>{methodLabel(o.paymentMethod)}</dd>
            {o.paymentId && <><dt className="text-gray-500">Payment ID</dt><dd className="font-mono break-all">{o.paymentId}</dd></>}
            {o.paymentRef && <><dt className="text-gray-500">Transaction ref</dt><dd className="font-mono break-all">{o.paymentRef}</dd></>}
          </dl>
          {data.payments.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-gray-500">
              {data.payments.map((p) => (
                <li key={p.id}>
                  {fmtDateTime(p.createdAt)} · {p.kind === "REFUND" ? "Refund" : "Payment"} · {methodLabel(p.method)} ·{" "}
                  <span className={p.result === "SUCCESS" ? "text-green-700" : "text-red-600"}>{p.result === "SUCCESS" ? "Success" : "Failed"}</span> · {inr(p.amount)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-gray-500 text-center">Keep this page's link to follow your order. It updates automatically.</p>
        <p className="text-center"><Link to="/restaurant" className="text-sm font-semibold text-[#B8893C]">← Order more food</Link></p>
      </div>
    </div>
  );
}
