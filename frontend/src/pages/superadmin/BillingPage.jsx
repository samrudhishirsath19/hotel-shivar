import { Fragment, useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { inr, can } from "../../roles";
import { ymd, daysAgo, fmtDateTime } from "../../dates";
import useBoard from "./useBoard";
import { PageTitle } from "./ui";
import { Ticket, Toast, PaymentBadge, orderTitle, orderKind, isInBilling } from "./Ticket";
import { methodLabel } from "../../orderStatus";
import { payable, inr2 } from "../../gst";
import { isRestaurantOffer, bestOffer, offerRules } from "../../offers";

const DESK_METHODS = ["CASH", "UPI", "CARD", "NET_BANKING", "WALLET"];
import { printBill } from "../../printBill";

const QUICK = [5, 10, 15, 20, 25];

// Discount on one restaurant bill, before it is printed: pick an offer, or give any % (with a reason).
function DiscountPanel({ order: o, offers, suggested, onOffer, onPercent }) {
  const [mode, setMode] = useState(offers.length ? "offer" : "percent");
  const [pick, setPick] = useState(null);
  const [percent, setPercent] = useState("");
  const [reason, setReason] = useState("");

  if (Number(o.discountAmount) > 0) {
    return (
      <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-dashed border-green-600 bg-green-50 px-2 py-1.5 text-xs">
        <span className="text-green-800">
          🏷️ <b>{o.offerCode ? "Offer applied:" : "Discount given:"}</b> {o.offerCode ? `${o.offerTitle || o.offerCode} (${o.offerCode})` : o.offerTitle}
          {" "}· saved {inr2(o.discountAmount)}
          {o.discountBy && <span className="block text-green-700">by {o.discountBy}{o.discountReason ? ` · ${o.discountReason}` : ""}</span>}
        </span>
        <button onClick={() => (o.offerCode ? onOffer("") : onPercent(0, ""))} className="text-red-600 font-semibold shrink-0">Remove</button>
      </div>
    );
  }

  const code = pick ?? suggested?.code ?? "";
  const pct = Number(percent);
  const pctOk = Number.isInteger(pct) && pct >= 1 && pct <= 100;
  const preview = pctOk ? (Number(o.total) * pct) / 100 : 0;
  const tab = (id, label) => (
    <button type="button" onClick={() => setMode(id)}
      className={`px-2 py-1 rounded-md ${mode === id ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>{label}</button>
  );

  return (
    <div className="mb-2 rounded-lg border bg-gray-50 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700">Discount (optional)</span>
        <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5 text-[11px] font-semibold">
          {offers.length > 0 && tab("offer", "Offer")}
          {tab("percent", "Discount %")}
        </div>
      </div>
      {mode === "offer" && offers.length > 0 ? (
        <div className="mt-2 flex gap-2">
          <select value={code} onChange={(e) => setPick(e.target.value)} aria-label="Offer"
            className="flex-1 min-w-0 border rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="">Choose an offer</option>
            {offers.map((f) => (
              <option key={f.id} value={f.code}>
                {f.code} - {f.discountPercent}% off{suggested?.code === f.code ? " ★ best" : ""} · {offerRules(f).slice(2).join(", ") || "any bill"}
              </option>
            ))}
          </select>
          <button disabled={!code} onClick={() => onOffer(code)}
            className="px-3 py-1.5 rounded-lg bg-[#B8893C] text-white text-xs font-bold disabled:opacity-40">Apply</button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => setPercent(String(q))}
                className={`px-2 py-1 rounded-md border text-[11px] font-bold ${pct === q ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white"}`}>{q}%</button>
            ))}
            <input value={percent} onChange={(e) => setPercent(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} inputMode="numeric"
              aria-label="Discount percent" placeholder="Other %" className="w-16 border rounded-md px-2 py-1 text-[11px]" />
          </div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200}
            placeholder="Reason (e.g. regular guest, birthday, complaint)" className="w-full border rounded-lg px-2 py-1.5 text-xs" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500">{pctOk ? `${pct}% of ${inr2(o.total)} = ${inr2(preview)} off (before GST)` : percent ? "Enter 1 to 100" : ""}</span>
            <button disabled={!pctOk} onClick={() => onPercent(pct, reason.trim())}
              className="px-3 py-1.5 rounded-lg bg-[#B8893C] text-white text-xs font-bold disabled:opacity-40">Give {pctOk ? `${pct}%` : "discount"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const canPay = can(user?.role, "BILLING_PAY");
  const canDiscount = can(user?.role, "BILLING_DISCOUNT"); // offers / discount % on restaurant bills
  const { board, error: boardError, msg, run } = useBoard();
  const [from, setFrom] = useState(ymd(new Date()));
  const [to, setTo] = useState(ymd(new Date()));
  const [bills, setBills] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const [tick, setTick] = useState(0); // bump to reload the paid list
  const [offers, setOffers] = useState([]); // live restaurant offers, for "Apply offer"

  useEffect(() => {
    if (!canDiscount) return;
    const today = ymd(new Date());
    apiFetch("/api/offers?activeOnly=true")
      .then((d) => setOffers((d || []).filter((o) => o.code && isRestaurantOffer(o) && (!o.validFrom || o.validFrom <= today)
        && !(o.usageLimit && (o.usedCount || 0) >= o.usageLimit))))
      .catch(() => setOffers([]));
  }, [canDiscount]);

  // the best restaurant offer for each unpaid bill (pre-selected in its list): orderId -> code
  const [suggested, setSuggested] = useState({});
  const billKey = (board?.tables || []).map((t) => t.order).concat(board?.rooms || [])
    .filter((o) => o && isInBilling(o) && !o.offerCode).map((o) => `${o.id}:${o.total}`).join(",");
  useEffect(() => {
    if (!canDiscount || !offers.length || !billKey) return;
    let alive = true;
    billKey.split(",").forEach((k) => {
      const [id, total] = k.split(":");
      bestOffer({ kind: "RESTAURANT", amount: total })
        .then((r) => { if (alive && r.valid) setSuggested((s) => ({ ...s, [id]: r })); })
        .catch(() => {});
    });
    return () => { alive = false; };
  }, [canDiscount, offers.length, billKey]);

  // apply (or with "" remove) an offer on a bill before it is printed; GST is worked out again by the server
  const applyOffer = (o, code) =>
    run(o.id, "offer", code ? `🏷️ Offer ${code} applied to ${orderTitle(o)}` : `Discount removed from ${orderTitle(o)}`, { code });

  // any discount % decided at the desk (0 removes it)
  const applyDiscount = (o, percent, reason) =>
    run(o.id, "discount", percent ? `🏷️ ${percent}% discount given on ${orderTitle(o)}` : `Discount removed from ${orderTitle(o)}`, { percent, reason });

  useEffect(() => {
    if (!from || !to || from > to) return;
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/admin/billing?from=${from}&to=${to}`)
      .then((d) => { if (!cancelled) { setBills(d || []); setError(""); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to, tick]);

  // running orders: tables, room service and accepted online orders
  const running = [
    ...(board?.tables || []).filter((t) => t.order).map((t) => t.order),
    ...(board?.rooms || []),
    ...(board?.online || []).filter((o) => o.status === "ACCEPTED"),
  ].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  // the captain sends an order here once it has been served / shipped
  const unpaid = running.filter(isInBilling);
  const inService = running.length - unpaid.length;

  // how each unpaid bill is being paid: orderId -> { method, reference, customerName }
  const [payWith, setPayWith] = useState({});
  const payOf = (id) => payWith[id] || { method: "CASH", reference: "", customerName: null };
  // name typed at the desk, or the name the order already has (online orders)
  const nameOf = (o) => (payOf(o.id).customerName ?? o.customerName ?? "");
  const setPay = (id, patch) => setPayWith((p) => ({ ...p, [id]: { ...payOf(id), ...patch } }));

  const pay = async (o) => {
    const { method, reference } = payOf(o.id);
    const customerName = nameOf(o).trim();
    if (!window.confirm(`Mark ${orderTitle(o)} as paid (${inr2(payable(o))}) by ${methodLabel(method)}?`)) return;
    const ok = await run(o.id, "paid", `✅ ${orderTitle(o)} - bill paid (${methodLabel(method)})`,
      { method, reference: reference.trim() || null, customerName: customerName || null });
    if (ok) setTick((t) => t + 1);
  };

  const quick = (a, b) => { setFrom(daysAgo(a)); setTo(daysAgo(b)); };
  const total = bills.reduce((s, b) => s + payable(b), 0);
  const gstCollected = bills.reduce((s, b) => s + Number(b.taxAmount || 0), 0);

  return (
    <div>
      <Toast msg={msg} />
      <PageTitle title="Billing" sub="Take payment for running orders, and see all paid bills" />

      {(boardError || error) && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{boardError || error}</p>}

      <h2 className="mb-1 font-bold text-gray-900">Sent to billing - unpaid ({unpaid.length})</h2>
      <p className="text-xs text-gray-500 mb-3">
        Orders appear here when the captain presses “Ready to Billing” after the meal.
        {board && inService > 0 && ` ${inService} more order${inService > 1 ? "s are" : " is"} still in the kitchen / being served.`}
      </p>
      {board && unpaid.length === 0 && <p className="text-sm text-gray-400 mb-6">No unpaid bills right now.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {unpaid.map((o) => (
          <Ticket key={o.id} title={orderTitle(o)} sub={o.orderType === "ONLINE" ? `${o.customerName} · ${o.customerPhone}` : `KOT #${o.id}`}
            badge={orderKind(o)} order={o}>
            {canPay ? (
            <div className="w-full">
              <input value={nameOf(o)} onChange={(e) => setPay(o.id, { customerName: e.target.value })} maxLength={100}
                aria-label="Customer name" placeholder="Customer name (printed on the bill)"
                className="w-full mb-2 border rounded-lg px-2 py-1.5 text-xs" />
              {o.orderType !== "ONLINE" && canDiscount && (
                <DiscountPanel
                  order={o}
                  offers={offers}
                  suggested={suggested[o.id]}
                  onOffer={(code) => applyOffer(o, code)}
                  onPercent={(percent, reason) => applyDiscount(o, percent, reason)}
                />
              )}
              <div className="flex gap-2">
                <select value={payOf(o.id).method} onChange={(e) => setPay(o.id, { method: e.target.value })} aria-label="Payment method"
                  className="border rounded-lg px-2 py-1.5 text-xs bg-white">
                  {DESK_METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
                </select>
                {payOf(o.id).method !== "CASH" && (
                  <input value={payOf(o.id).reference} onChange={(e) => setPay(o.id, { reference: e.target.value })} maxLength={100}
                    placeholder="UTR / slip no. (optional)" className="flex-1 min-w-0 border rounded-lg px-2 py-1.5 text-xs" />
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => printBill({ ...o, customerName: nameOf(o).trim() || null }, { mode: payOf(o.id).method })}
                  className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold">🖨️ Print Bill</button>
                <button onClick={() => pay(o)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">Bill Paid</button>
              </div>
            </div>
            ) : (
              <button onClick={() => printBill(o)} className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold">🖨️ Print Bill</button>
            )}
          </Ticket>
        ))}
      </div>

      <h2 className="mb-3 font-bold text-gray-900">Paid bills</h2>
      <div className="flex flex-wrap items-end gap-3 bg-white border rounded-xl p-4">
        <div><label className="block text-xs text-gray-500">From</label><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
        <div><label className="block text-xs text-gray-500">To</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
        <button onClick={() => quick(0, 0)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Today</button>
        <button onClick={() => quick(1, 1)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Yesterday</button>
        <button onClick={() => quick(6, 0)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Last 7 days</button>
        {loading && <span className="text-xs text-gray-400">Loading...</span>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 max-w-2xl">
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Bills</p><p className="text-2xl font-bold">{bills.length}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Total collected (incl. GST)</p><p className="text-2xl font-bold text-green-600">{inr(total)}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">GST collected</p><p className="text-2xl font-bold text-gray-900">{inr2(gstCollected)}</p></div>
      </div>

      <div className="mt-4 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[880px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Bill</th><th className="p-3">Paid at</th><th className="p-3">For</th><th className="p-3">Type</th><th className="p-3">Items</th><th className="p-3">Payment</th><th className="p-3 text-right">Total</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {bills.length === 0 && <tr><td colSpan="8" className="p-6 text-center text-gray-400">No paid bills in this period</td></tr>}
            {bills.map((b) => (
              <Fragment key={b.id}>
                <tr onClick={() => setOpen(open === b.id ? null : b.id)} className="border-b cursor-pointer hover:bg-gray-50">
                  <td className="p-3">#{b.id}</td>
                  <td className="p-3">{fmtDateTime(b.paidAt)}</td>
                  <td className="p-3 font-semibold">{orderTitle(b)}{b.orderType === "ONLINE" && <span className="font-normal text-gray-500"> · {b.customerName}</span>}</td>
                  <td className="p-3">{orderKind(b)}</td>
                  <td className="p-3">{b.lines.reduce((s, l) => s + l.quantity, 0)} {open === b.id ? "▲" : "▼"}</td>
                  <td className="p-3">{b.paymentStatus ? <PaymentBadge order={b} /> : <span className="text-xs text-gray-400">-</span>}</td>
                  <td className="p-3 text-right">
                    <div className="font-bold">{inr2(payable(b))}</div>
                    {b.taxAmount > 0 && <div className="text-[11px] text-gray-500">incl. GST {inr2(b.taxAmount)}</div>}
                    {b.discountAmount > 0 && (
                      <div className="text-[11px] text-green-700">
                        🏷️ {b.offerCode ? `offer ${b.offerCode}` : b.offerTitle} - {inr2(b.discountAmount)}{b.discountBy ? ` · by ${b.discountBy}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); printBill(b); }} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold whitespace-nowrap">🖨️ Print Bill</button>
                  </td>
                </tr>
                {open === b.id && (
                  <tr className="border-b bg-gray-50">
                    <td colSpan="8" className="p-3">
                      {b.paymentId && (
                        <p className="text-xs text-gray-600 mb-2">
                          Payment ID <span className="font-mono">{b.paymentId}</span>
                          {b.paymentRef && <> · Ref <span className="font-mono">{b.paymentRef}</span></>}
                          {b.deliveryAddress && <> · Delivered to {b.deliveryAddress}</>}
                        </p>
                      )}
                      {b.lines.map((l) => (
                        <div key={l.menuItemId} className="flex justify-between text-xs py-0.5 max-w-md">
                          <span>{l.quantity} x {l.name} @ {inr(l.unitPrice)}</span>
                          <span>{inr(l.unitPrice * l.quantity)}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
