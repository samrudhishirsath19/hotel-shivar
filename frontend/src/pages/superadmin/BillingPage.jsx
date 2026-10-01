import { Fragment, useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { inr } from "../../roles";
import { ymd, daysAgo, fmtDateTime } from "../../dates";
import useBoard from "./useBoard";
import { PageTitle } from "./ui";
import { Ticket, Toast, orderTitle, orderKind } from "./Ticket";

export default function BillingPage() {
  const { board, error: boardError, msg, run } = useBoard();
  const [from, setFrom] = useState(ymd(new Date()));
  const [to, setTo] = useState(ymd(new Date()));
  const [bills, setBills] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const [tick, setTick] = useState(0); // bump to reload the paid list

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

  // running orders that still have to be paid: tables, room service and accepted online orders
  const unpaid = [
    ...(board?.tables || []).filter((t) => t.order).map((t) => t.order),
    ...(board?.rooms || []),
    ...(board?.online || []).filter((o) => o.status === "ACCEPTED"),
  ].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  const pay = async (o) => {
    if (!window.confirm(`Mark ${orderTitle(o)} as paid (${inr(o.total)})?`)) return;
    if (await run(o.id, "paid", `✅ ${orderTitle(o)} - bill paid`)) setTick((t) => t + 1);
  };

  const quick = (a, b) => { setFrom(daysAgo(a)); setTo(daysAgo(b)); };
  const total = bills.reduce((s, b) => s + Number(b.total), 0);

  return (
    <div>
      <Toast msg={msg} />
      <PageTitle title="Billing" sub="Take payment for running orders, and see all paid bills" />

      {(boardError || error) && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{boardError || error}</p>}

      <h2 className="mb-3 font-bold text-gray-900">Unpaid bills ({unpaid.length})</h2>
      {board && unpaid.length === 0 && <p className="text-sm text-gray-400 mb-6">No unpaid bills right now.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {unpaid.map((o) => (
          <Ticket key={o.id} title={orderTitle(o)} sub={o.orderType === "ONLINE" ? `${o.customerName} · ${o.customerPhone}` : `KOT #${o.id}`}
            badge={orderKind(o)} order={o}>
            <button onClick={() => pay(o)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">Bill Paid</button>
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

      <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Bills</p><p className="text-2xl font-bold">{bills.length}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-green-600">{inr(total)}</p></div>
      </div>

      <div className="mt-4 bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Bill</th><th className="p-3">Paid at</th><th className="p-3">For</th><th className="p-3">Type</th><th className="p-3">Items</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody>
            {bills.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-400">No paid bills in this period</td></tr>}
            {bills.map((b) => (
              <Fragment key={b.id}>
                <tr onClick={() => setOpen(open === b.id ? null : b.id)} className="border-b cursor-pointer hover:bg-gray-50">
                  <td className="p-3">#{b.id}</td>
                  <td className="p-3">{fmtDateTime(b.paidAt)}</td>
                  <td className="p-3 font-semibold">{orderTitle(b)}{b.orderType === "ONLINE" && <span className="font-normal text-gray-500"> · {b.customerName}</span>}</td>
                  <td className="p-3">{orderKind(b)}</td>
                  <td className="p-3">{b.lines.reduce((s, l) => s + l.quantity, 0)} {open === b.id ? "▲" : "▼"}</td>
                  <td className="p-3 text-right font-bold">{inr(b.total)}</td>
                </tr>
                {open === b.id && (
                  <tr className="border-b bg-gray-50">
                    <td colSpan="6" className="p-3">
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
