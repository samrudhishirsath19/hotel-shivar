import useBoard from "./useBoard";
import { PageTitle } from "./ui";
import { Ticket, OrderActions, Toast, orderTitle, orderKind } from "./Ticket";

// Kitchen Order Tickets: every running order, oldest first.
export default function KotPage() {
  const { board, error, msg, run } = useBoard();

  const tables = (board?.tables || []).filter((t) => t.order).map((t) => t.order);
  const rooms = board?.rooms || [];
  const online = board?.online || [];
  const waiting = online.filter((o) => o.status === "PENDING");
  const kitchen = [...tables, ...rooms, ...online.filter((o) => o.status === "ACCEPTED")].sort((a, b) =>
    String(a.createdAt).localeCompare(String(b.createdAt))
  );

  return (
    <div>
      <Toast msg={msg} />
      <PageTitle title="KOT" sub="Kitchen order tickets - refreshes every few seconds" />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      {waiting.length > 0 && (
        <>
          <h2 className="mb-3 font-bold text-gray-900">New online orders - waiting to be accepted ({waiting.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {waiting.map((o) => (
              <Ticket key={o.id} title={orderTitle(o)} sub={`${o.customerName} · ${o.customerPhone}`} badge="NEW"
                badgeClass="bg-yellow-100 text-yellow-800" tone="border-yellow-300" order={o}>
                <OrderActions order={o} run={run} />
              </Ticket>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 font-bold text-gray-900">In the kitchen ({kitchen.length})</h2>
      {board && kitchen.length === 0 && <p className="text-sm text-gray-400">No running orders right now.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {kitchen.map((o) => (
          <Ticket key={o.id} title={orderTitle(o)} sub={o.orderType === "ONLINE" ? `${o.customerName} · ${o.customerPhone}` : `KOT #${o.id}`}
            badge={orderKind(o)} order={o}>
            <OrderActions order={o} run={run} />
          </Ticket>
        ))}
      </div>
    </div>
  );
}
