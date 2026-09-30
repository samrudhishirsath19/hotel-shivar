import useBoard from "./useBoard";
import { PageTitle } from "./ui";
import { Ticket, OrderActions, Toast } from "./Ticket";

export default function TablesPage() {
  const { board, error, msg, run } = useBoard();
  const tables = board?.tables || [];
  const occupied = tables.filter((t) => t.order).length;

  return (
    <div>
      <Toast msg={msg} />
      <PageTitle title="Tables" sub={board ? `${occupied} of ${tables.length} tables occupied` : "Loading..."} />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tables.map((t) =>
          t.order ? (
            <Ticket key={t.number} title={`Table ${t.number}`} badge="OCCUPIED" order={t.order}>
              <OrderActions order={t.order} run={run} paidLabel="Bill Paid - Free Table" />
            </Ticket>
          ) : (
            <div key={t.number} className="bg-white rounded-xl border-2 border-green-200 p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900">Table {t.number}</h3>
                <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-green-100 text-green-700">AVAILABLE</span>
              </div>
              <p className="text-xs text-gray-400 mt-8 text-center">No orders yet</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
