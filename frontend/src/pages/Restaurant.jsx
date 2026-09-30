import { useState } from "react";
import { useCart } from "../context/CartContext";

const menu = [
  { id: 1, name: "Misal Pav", price: 120, img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500" },
  { id: 3, name: "Samosa Chaat", price: 150, img: "/images/Samosa chat.jpg" },
  { id: 4, name: "Chicken Crispy", price: 350, img: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500" },
  { id: 5, name: "Paneer Tikka", price: 320, img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500" },
  { id: 15, name: "Butter Chicken", price: 380, img: "/images/Butter chicken.jpg" },
  { id: 18, name: "Hyderabadi Chicken Biryani", price: 420, img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500" },
];

export default function Restaurant() {
  const { cart, addToCart } = useCart();
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const getQty = (id) => cart.find((o) => o.id === id)?.qty || 0;

  return (
    <div className="bg-[#FFFBF5] min-h-screen pb-10">
      {/* ORDER SUCCESS MESSAGE FOR CUSTOMER */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#1F3B2D] text-white px-6 py-3 rounded-full shadow-lg z-[9999] font-bold text-sm">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10">
        <div className="flex justify-between items-center">
          <h1 className="font-serif text-3xl text-[#1F3B2D]">Our Menu</h1>
          <div className="text-sm bg-white border px-4 py-2 rounded-full">Cart Items: {cart.reduce((s, i) => s + i.qty, 0)}</div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Customer view - only online ordering. Table/Room assignment is done in Dashboard.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {menu.map((item) => {
          const q = getQty(item.id);
          return (
            <div key={item.id} className="bg-white rounded-2xl border overflow-hidden shadow-sm">
              <img src={item.img} className="h-44 w-full object-cover" alt={item.name} />
              <div className="p-4">
                <div className="flex justify-between">
                  <h3 className="font-bold">{item.name}</h3>
                  <span className="text-[#B8893C] font-bold">Rs.{item.price}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="flex border rounded-lg">
                    <button onClick={() => addToCart(item, -1)} className="px-3 py-1 font-bold">-</button>
                    <span className="px-3 py-1 text-sm font-bold">{q}</span>
                    <button
                      onClick={() => {
                        addToCart(item, 1);
                        showToast(`${item.name} added to cart`);
                      }}
                      className="px-3 py-1 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(item, 1);
                      showToast(`Order placed: ${item.name} - Check dashboard KOT`);
                    }}
                    className={`flex-1 rounded-lg text-sm font-bold ${q > 0? "bg-[#1F3B2D] text-white" : "bg-gray-100"}`}
                  >
                    {q > 0? `${q} x Added` : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}