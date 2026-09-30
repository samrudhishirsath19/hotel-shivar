import { useTables } from "../context/TableContext";
import { useCart } from "../context/CartContext";
export default function Kitchen(){
  const { tables, rooms } = useTables();
  const { onlineOrders } = useCart();
  return (
    <div className="p-6 pt-20 bg-[#FFFBF5] min-h-screen">
      <h1 className="text-2xl font-bold">Kitchen Display - KOT</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {Object.entries(tables).map(([no,d])=> d.orders.length>0 && (
          <div key={no} className="bg-white border-l-4 border-orange-500 p-4 rounded-xl shadow"><h3 className="font-bold">Table T{no} - NEW</h3>{d.orders.map(o=><div key={o.id} className="text-sm">{o.name} x {o.qty}</div>)}</div>
        ))}
        {Object.entries(rooms).map(([no,d])=> d.orders.length>0 && (
          <div key={no} className="bg-white border-l-4 border-purple-500 p-4 rounded-xl shadow"><h3 className="font-bold">Room {no} - NEW</h3>{d.orders.map(o=><div key={o.id} className="text-sm">{o.name} x {o.qty}</div>)}</div>
        ))}
        {onlineOrders.map(o=>(
          <div key={o.id} className="bg-white border-l-4 border-blue-500 p-4 rounded-xl shadow"><h3 className="font-bold">Online Order #{o.id.toString().slice(-4)}</h3>{o.orders.map(i=><div key={i.id} className="text-sm">{i.name} x {i.qty}</div>)}</div>
        ))}
      </div>
    </div>
  );
}