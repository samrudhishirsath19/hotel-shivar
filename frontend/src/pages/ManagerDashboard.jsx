import { useTables } from "../context/TableContext";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Manager() {
  const { tables, rooms, clearTable, clearRoom } = useTables();
  const { cart, onlineOrders, clearOnlineOrder, clearCart, placeOnlineOrder } = useCart();
  const [msg, setMsg] = useState("");

  const getTotal = (orders) => orders.reduce((s, i) => s + i.price * i.qty, 0);
  const cartTotal = getTotal(cart);

  return (
    <div className="bg-[#FFFBF5] min-h-screen pt-20 px-4 md:px-8 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl text-[#1F3B2D]">Manager Dashboard</h1>
        <Link to="/restaurant" className="px-5 py-2 rounded-full bg-[#1F3B2D] text-white text-sm font-bold">Back to Menu</Link>
      </div>
      {msg && <div className="mt-4 bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-center">{msg}</div>}

      {/* 1. ONLINE CART - PENDING (Add to Cart kelya kelya disel) */}
      <h2 className="mt-8 mb-3 font-bold text-lg">🛒 Online Cart - Pending ({cart.length})</h2>
      {cart.length === 0? (
        <p className="text-xs text-gray-400 bg-white border p-4 rounded-xl">No items in online cart yet. Customer ne Online la Add kela ki itha disel.</p>
      ) : (
        <div className="bg-white rounded-2xl border p-4 shadow-sm border-orange-300 max-w-md">
          {cart.map(o => <div key={o.id} className="flex justify-between text-sm py-1"><span>{o.name} x {o.qty}</span><span className="font-bold">₹{o.price*o.qty}</span></div>)}
          <div className="border-t mt-3 pt-2 flex justify-between font-bold"><span>Total</span><span className="text-[#B8893C]">₹{cartTotal}</span></div>
          <p className="text-[11px] text-gray-500 mt-2">Customer ne Cart madhe add kelay, pan Place Order baki aahe.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => { placeOnlineOrder(); setMsg("✅ Online Order Placed! Cart is now 0"); setTimeout(()=>setMsg(""),3000); }} className="flex-1 py-2 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Accept & Place Order</button>
            <button onClick={clearCart} className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Cancel</button>
          </div>
        </div>
      )}

      {/* 2. ONLINE ORDERS - PLACED */}
      <h2 className="mt-8 mb-3 font-bold text-lg">✅ Online Orders - Placed ({onlineOrders.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {onlineOrders.length === 0 && <p className="text-xs text-gray-400">No placed online orders yet</p>}
        {onlineOrders.map(o => (
          <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm border-blue-300">
            <div className="flex justify-between"><h3 className="font-bold">Online #{o.id.toString().slice(-4)}</h3><span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{o.time}</span></div>
            <div className="mt-3">{o.orders.map(it => <div key={it.id} className="flex justify-between text-sm py-1"><span>{it.name} x {it.qty}</span><span className="font-bold">₹{it.price*it.qty}</span></div>)}</div>
            <div className="border-t mt-3 pt-2 flex justify-between font-bold text-sm"><span>Total</span><span className="text-[#B8893C]">₹{o.total}</span></div>
            <button onClick={() => { clearOnlineOrder(o.id); setMsg(`✅ Online Order #${o.id.toString().slice(-4)} Completed - Bill Paid`); setTimeout(()=>setMsg(""),3000); }} className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">Bill Paid - Complete Order</button>
          </div>
        ))}
      </div>

      {/* TABLES */}
      <h2 className="mt-10 mb-3 font-bold text-lg">🍽️ Tables</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1,2,3,4,5].map(no => {
          const data = tables[no] || { orders: [], status: "available" };
          return (
            <div key={no} className={`bg-white rounded-2xl border p-4 ${data.status==="occupied"?"border-orange-400":""}`}>
              <div className="flex justify-between"><h3 className="font-bold">Table {no}</h3><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${data.status==="occupied"?"bg-orange-100 text-orange-700":"bg-green-100 text-green-700"}`}>{data.status.toUpperCase()}</span></div>
              {data.orders.length===0? <p className="text-xs text-gray-400 mt-6 text-center">No orders yet</p> : <>
                {data.orders.map(o=> <div key={o.id} className="flex justify-between text-sm mt-2"><span>{o.name} x {o.qty}</span><span className="font-bold">₹{o.price*o.qty}</span></div>)}
                <div className="border-t mt-3 pt-2 flex justify-between font-bold text-sm"><span>Total</span><span className="text-[#B8893C]">₹{getTotal(data.orders)}</span></div>
                <button onClick={()=>{ clearTable(no); setMsg(`✅ Table ${no} - Bill Paid - Clean the Table`); }} className="w-full mt-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Bill Paid - Clean the Table</button>
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}