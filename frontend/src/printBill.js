// Printable bills: restaurant bills (printBill) and room invoices (printBookingInvoice).
// The GST on them is the GST stored on the order / booking when it was worked out - it is never added again.
import { methodLabel } from "./orderStatus";
import { loadGst, taxOf, pct } from "./gst";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const rs2 = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const when = (d) => {
  const x = new Date(d);
  if (isNaN(x)) return "";
  return x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + ", " +
    x.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
};

const STYLE = `
  /* margin 0 = the browser prints no header/footer (page title, date, address) */
  @page { size: auto; margin: 0; }
  *{box-sizing:border-box;}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:6mm 4mm;}
  /* compact receipt: about 80 mm wide */
  .bill{max-width:300px;margin:0 auto;font-size:11px;}
  .c{text-align:center;}
  h1{font-size:17px;margin:0;text-align:center;}
  .addr{text-align:center;color:#555;font-size:10px;margin:3px 0 0;}
  .gstin{text-align:center;color:#555;font-size:10px;margin:2px 0 0;}
  h2{font-size:11px;letter-spacing:1px;text-align:center;margin:7px 0 0;}
  .meta{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-top:8px;line-height:1.5;}
  .meta .right{text-align:right;white-space:nowrap;}
  table{width:100%;border-collapse:collapse;margin-top:7px;}
  th{text-align:left;font-weight:bold;padding:3px 1px;border-bottom:1px dashed #bbb;}
  td{padding:3px 1px;border-bottom:1px dashed #bbb;vertical-align:top;}
  th.n,td.n{text-align:right;white-space:nowrap;padding-left:6px;}
  tr.sum td{border-bottom:none;padding:2px 1px;}
  tr.sum:first-child td{padding-top:4px;}
  tr.total td{font-weight:bold;font-size:13px;border-bottom:none;border-top:2px solid #111;padding-top:4px;}
  .after{margin-top:5px;line-height:1.5;}
  .note{font-size:9px;color:#555;margin-top:4px;}
  .thanks{text-align:center;font-weight:bold;margin-top:8px;}
  @media print{button{display:none;}}`;

// Opens the window straight away (so pop-up blockers allow it), then fills it in.
function openAndPrint(buildHtml) {
  const w = window.open("", "_blank", "width=420,height=700");
  if (!w) {
    alert("Please allow pop-ups for this site to print the bill.");
    return;
  }
  w.document.write("<p style='font-family:Arial;padding:24px'>Preparing bill...</p>");
  loadGst()
    .catch(() => null)
    .then((gst) => {
      const body = buildHtml(gst);
      w.document.open();
      // empty-looking title: nothing like "Bill #15 - Hotel Shivar" in the tab or on paper
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>&#8203;</title><style>${STYLE}</style></head>
<body><div class="bill">${body}<p class="c" style="margin-top:10px"><button onclick="window.print()">Print</button></p></div>
<script>window.onload=function(){window.print();};</script></body></html>`);
      w.document.close();
      w.focus();
    });
}

function header(gst, heading) {
  return `
  <h1>${esc(gst?.legalName || "Hotel Shivar")}</h1>
  <p class="addr">${esc(gst?.address || "Kamshet, Maharashtra")}</p>
  ${gst?.gstin ? `<p class="gstin">GSTIN: ${esc(gst.gstin)}</p>` : ""}
  <h2>${heading}</h2>`;
}

// rows under the item table: Taxable value, CGST, SGST, Total GST, then the amount payable
function totalRows(t, amount) {
  if (!t) {
    return `<tr class="total"><td colspan="3">Total</td><td class="n">${rs2(amount)}</td></tr>`;
  }
  const tax = t.tax === 0
    ? `<tr class="sum"><td colspan="3">GST</td><td class="n">Nil</td></tr>`
    : `<tr class="sum"><td colspan="3">CGST @ ${pct(t.rate / 2)}</td><td class="n">${rs2(t.cgst)}</td></tr>
       <tr class="sum"><td colspan="3">SGST @ ${pct(t.rate / 2)}</td><td class="n">${rs2(t.sgst)}</td></tr>
       <tr class="sum"><td colspan="3">Total GST (${pct(t.rate)})</td><td class="n">${rs2(t.tax)}</td></tr>`;
  return `
    <tr class="sum"><td colspan="3">Taxable value</td><td class="n">${rs2(t.taxable)}</td></tr>
    ${tax}
    <tr class="total"><td colspan="3">Amount payable</td><td class="n">${rs2(t.total)}</td></tr>`;
}

const forWhom = (o) =>
  o.orderType === "TABLE" ? `Table ${esc(o.tableNumber)}`
    : o.orderType === "ROOM" ? `Room ${esc(o.roomNumber)} (room service)`
      : "Online order";

// opts.mode = payment method chosen at the desk (used when the bill is printed before it is marked paid)
export function printBill(order, opts = {}) {
  const paid = order.status === "PAID";
  const t = taxOf(order, "total");
  openAndPrint((gst) => {
    const rows = order.lines
      .map((l) => `<tr><td>${esc(l.name)}</td><td class="n">${l.quantity}</td><td class="n">${rs2(l.unitPrice)}</td><td class="n">${rs2(l.unitPrice * l.quantity)}</td></tr>`)
      .join("");
    const isInvoice = t && t.tax > 0;
    const method = order.paymentStatus === "PAID" ? order.paymentMethod : opts.mode;
    return `
  ${header(gst, isInvoice ? "TAX INVOICE" : "BILL")}
  <div class="meta">
    <div>
      <div><b>Bill no:</b> #${order.id}</div>
      <div><b>Name:</b> ${esc(order.customerName || "-")}</div>
      <div><b>For:</b> ${forWhom(order)}</div>
      ${order.customerPhone ? `<div><b>Phone:</b> ${esc(order.customerPhone)}</div>` : ""}
      ${order.deliveryAddress ? `<div><b>Deliver to:</b> ${esc(order.deliveryAddress)}</div>` : ""}
      ${isInvoice && gst?.sacFood ? `<div><b>SAC:</b> ${esc(gst.sacFood)}</div>` : ""}
    </div>
    <div class="right">
      <div><b>Date:</b> ${esc(when(paid && order.paidAt ? order.paidAt : new Date()))}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>${totalRows(t, order.total)}</tfoot>
  </table>
  ${method ? `<div class="after"><b>Mode:</b> ${esc(methodLabel(method))}${paid && order.paymentRef ? ` · Ref ${esc(order.paymentRef)}` : ""}</div>` : ""}
  ${!t ? `<p class="note">Bill issued before GST was set up in the system - no GST was charged on it.</p>` : ""}
  <p class="thanks">${paid ? "Paid - Thank you!" : "Thank you! Please visit again."}</p>`;
  });
}

// Room invoice for a booking: nights x price per night + room GST (rate chosen by the price per night).
export function printBookingInvoice(b) {
  const t = taxOf(b, "roomCharges");
  openAndPrint((gst) => {
    const perNight = Number(b.room?.pricePerNight || 0);
    const nights = b.nights || Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000));
    const charges = b.roomCharges != null ? Number(b.roomCharges) : perNight * nights;
    const isInvoice = t && t.tax > 0;
    return `
  ${header(gst, isInvoice ? "TAX INVOICE" : "INVOICE")}
  <div class="meta">
    <div>
      <div><b>Booking no:</b> #${b.id}</div>
      <div><b>Name:</b> ${esc(b.guestName)}</div>
      <div><b>Room:</b> ${esc(b.room?.name || "Room")} (No. ${esc(b.room?.roomNumber)})</div>
      <div><b>Stay:</b> ${esc(b.checkIn)} to ${esc(b.checkOut)} · ${b.numberOfGuests} guest${b.numberOfGuests > 1 ? "s" : ""}</div>
      ${b.phone ? `<div><b>Phone:</b> ${esc(b.phone)}</div>` : ""}
      ${isInvoice && gst?.sacRoom ? `<div><b>SAC:</b> ${esc(gst.sacRoom)}</div>` : ""}
    </div>
    <div class="right">
      <div><b>Date:</b> ${esc(when(new Date()))}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Item</th><th class="n">Nights</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead>
    <tbody><tr><td>Room tariff</td><td class="n">${nights}</td><td class="n">${rs2(perNight)}</td><td class="n">${rs2(charges)}</td></tr></tbody>
    <tfoot>${totalRows(t, charges)}</tfoot>
  </table>
  ${!t ? `<p class="note">Booking made before GST was set up in the system - no GST was charged on it.</p>` : ""}
  <p class="thanks">Thank you for staying with us!</p>`;
  });
}
