import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../api";

// Public menu for customers: browse and order online through the cart.
// (Table / room orders are taken by staff inside the dashboard.)
export default function Restaurant() {
  const [menu, setMenu] = useState([]);
  const [menuState, setMenuState] = useState("loading"); // loading | ok | error
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("All");
  const [toast, setToast] = useState("");

  const { cart, addToCart } = useCart();

  const showToast = (txt) => { setToast(txt); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    apiFetch("/api/menu")
      .then((d) => { setMenu(d || []); setMenuState("ok"); })
      .catch(() => setMenuState("error"));
  }, []);

  // categories come from the menu itself, so new categories appear automatically
  const byType = menu.filter((m) => typeFilter === "all" || m.type === typeFilter || m.type === "common");
  const visibleCats = ["All", ...Array.from(new Set(byType.map((m) => m.category)))];
  const filtered = byType.filter((m) => catFilter === "All" || m.category === catFilter);

  const getQty = (id) => cart.find((o) => o.id === id)?.qty || 0;

  const plus = (item) => { addToCart(item, 1); showToast(`🛒 Added to cart: ${item.name}`); };
  const minus = (item) => addToCart(item, -1);

  return (
    <div className="bg-[#FFFBF5] min-h-screen pb-10">
      {toast && (
        <div className="fixed top-[80px] left-1/2 -translate-x-1/2 bg-[#1F3B2D] text-white px-6 py-3 rounded-full shadow-lg font-bold z-[9999] text-sm text-center">
          {toast}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20">
        <h1 className="font-serif text-3xl text-[#1F3B2D]">Our Menu</h1>
        <p className="text-sm text-gray-500 mt-1">Add items to your cart, then open the 🛒 Cart at the top and press Place Order.</p>

        <div className="flex gap-3 mt-6 items-center flex-wrap">
          <button onClick={() => { setTypeFilter("all"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "all" ? "bg-[#1F3B2D] text-white" : "bg-white"}`}>All</button>
          <button onClick={() => { setTypeFilter("veg"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "veg" ? "bg-green-600 text-white" : "bg-white"}`}>🟩 Veg Only</button>
          <button onClick={() => { setTypeFilter("nonveg"); setCatFilter("All"); }} className={`px-5 py-2 rounded-full text-sm font-semibold border ${typeFilter === "nonveg" ? "bg-red-600 text-white" : "bg-white"}`}>🟥 Non-Veg</button>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {visibleCats.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium border ${catFilter === c ? "bg-[#B8893C] text-white border-[#B8893C]" : "bg-white text-gray-600"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {menuState === "loading" && <p className="text-center text-gray-500 py-16">Loading menu...</p>}
        {menuState === "error" && <p className="text-center text-red-600 py-16">Could not load the menu. Please check that the backend is running.</p>}
        {menuState === "ok" && filtered.length === 0 && <p className="text-center text-gray-500 py-16">No items to show.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const q = getQty(item.id);
            return (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border flex flex-col">
                {item.imageUrl ? (
                  <img src={item.imageUrl} loading="lazy" className="w-full h-40 object-cover" alt={item.name} />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-3xl">🍽️</div>
                )}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif text-[#1F3B2D] text-[15px]">{item.name}</h3>
                      <span className="text-[#B8893C] font-bold text-sm">₹{item.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex items-center border rounded-lg">
                      <button onClick={() => minus(item)} className="px-3 py-1 font-bold text-lg select-none">-</button>
                      <span className="px-2 text-sm w-6 text-center font-bold text-[#1F3B2D]">{q}</span>
                      <button onClick={() => plus(item)} className="px-3 py-1 font-bold text-lg select-none">+</button>
                    </div>
                    <button onClick={() => plus(item)} className={`flex-1 text-center text-xs font-bold py-2 rounded-lg border transition ${q > 0 ? "bg-[#1F3B2D] text-white" : "bg-white text-gray-600 hover:bg-[#1F3B2D] hover:text-white"}`}>
                      {q > 0 ? `${q} x In cart ✓` : "Add to cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
