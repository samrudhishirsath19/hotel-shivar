// Opens a printable bill for one order in a new window and starts printing.
import { inr } from "./roles";
import { fmtDateTime } from "./dates";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const forWhom = (o) =>
  o.orderType === "TABLE" ? `Table ${o.tableNumber}` : o.orderType === "ROOM" ? `Room ${o.roomNumber} (room service)` : "Online order";

export function printBill(order) {
  const rows = order.lines
    .map(
      (l) => `<tr><td>${esc(l.name)}</td><td class="r">${l.quantity}</td><td class="r">${inr(l.unitPrice)}</td><td class="r">${inr(l.unitPrice * l.quantity)}</td></tr>`
    )
    .join("");
  const paid = order.status === "PAID";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bill #${order.id} - Hotel Shivar</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:24px;}
  .bill{max-width:380px;margin:0 auto;}
  h1{font-size:20px;margin:0;text-align:center;} .c{text-align:center;} .muted{color:#555;font-size:12px;}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;}
  th,td{padding:5px 2px;border-bottom:1px dashed #bbb;text-align:left;} .r{text-align:right;}
  .total td{font-weight:bold;font-size:15px;border-bottom:none;border-top:2px solid #111;}
  .meta{margin-top:12px;font-size:13px;line-height:1.6;}
  .stamp{margin-top:10px;text-align:center;font-weight:bold;font-size:13px;}
  @media print{body{padding:0;} button{display:none;}}
</style></head><body><div class="bill">
  <h1>Hotel Shivar</h1>
  <p class="c muted">Kamshet, Maharashtra</p>
  <div class="meta">
    <div><b>Bill no:</b> #${order.id}</div>
    <div><b>For:</b> ${esc(forWhom(order))}</div>
    ${order.customerName ? `<div><b>Customer:</b> ${esc(order.customerName)}${order.customerPhone ? " · " + esc(order.customerPhone) : ""}</div>` : ""}
    <div><b>Ordered:</b> ${esc(fmtDateTime(order.createdAt))}</div>
    <div><b>${paid ? "Paid" : "Printed"}:</b> ${esc(fmtDateTime(paid ? order.paidAt : new Date().toISOString()))}</div>
  </div>
  <table>
    <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="total"><td colspan="3">Total</td><td class="r">${inr(order.total)}</td></tr></tfoot>
  </table>
  <p class="stamp">${paid ? "PAID - Thank you!" : "Thank you! Please visit again."}</p>
  <p class="c"><button onclick="window.print()">Print</button></p>
</div>
<script>window.onload=function(){window.print();};</script>
</body></html>`;

  const w = window.open("", "_blank", "width=480,height=720");
  if (!w) {
    alert("Please allow pop-ups for this site to print the bill.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
}
