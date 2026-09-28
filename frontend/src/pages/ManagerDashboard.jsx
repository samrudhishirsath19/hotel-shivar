import { useTables } from "../context/TableContext";
import { Link } from "react-router-dom";

export default function ManagerDashboard(){
  const { tables, clearTable } = useTables();

  return (
    <div className="min-h-screen bg-[#FFFBF5] pt-20 px-4 md:px-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl text-[#1F3B2D]">Manager Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">5 Tables - Live Order Tracking</p>
        </div>
        <Link to="/restaurant" className="bg-[#1F3B2D] text-white px-5 py-2 rounded-full text-sm">Back to Menu</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {[1,2,3,4,5].map(no => {
          const t = tables[no];
          const total = t.orders.reduce((s,i)=> s + i.price*i.qty, 0);
          const totalItems = t.orders.reduce((s,i)=> s + i.qty, 0);
          return (
            <div key={no} className={`rounded-2xl border p-5 flex flex-col ${t.status==='occupied'? 'bg-white shadow-lg border-orange-200' : 'bg-white border-gray-200 opacity-70'}`}>
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">Table {no}</h2>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${t.status==='occupied'? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {t.status==='occupied'? `OCCUPIED • ${totalItems} items` : 'AVAILABLE'}
                </span>
              </div>

              {t.orders.length === 0? (
                <div className="flex-1 flex items-center justify-center py-10">
                  <p className="text-sm text-gray-400">No orders yet - Table is empty</p>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-2 flex-1">
                    {t.orders.map((item, idx)=>(
                      <div key={idx} className="flex justify-between text-[13px] border-b border-dashed pb-1.5">
                        <span className="text-[#1F3B2D]">{item.name} x {item.qty} <span className="text-[10px] text-gray-400 ml-1">{item.time}</span></span>
                        <span className="font-bold">₹{item.price*item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <span className="font-bold text-[#1F3B2D]">Total: ₹{total}</span>
                    <button onClick={()=>{ if(confirm(`Table ${no} clear? Bill paid?`)) clearTable(no)}} className="bg-[#1F3B2D] text-white px-4 py-1.5 rounded-full text-xs">Bill Paid / Clear</button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}