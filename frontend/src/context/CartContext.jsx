import { createContext, useContext, useState, useEffect } from "react";
const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { const s = localStorage.getItem("shivar_cart"); return s? JSON.parse(s) : []; } catch { return []; }
  });
  const [onlineOrders, setOnlineOrders] = useState(() => {
    try { const s = localStorage.getItem("shivar_online"); return s? JSON.parse(s) : []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("shivar_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("shivar_online", JSON.stringify(onlineOrders)); }, [onlineOrders]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "shivar_cart") setCart(JSON.parse(e.newValue||"[]"));
      if (e.key === "shivar_online") setOnlineOrders(JSON.parse(e.newValue||"[]"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = (item, delta) => {
    setCart(prev => {
      const ex = prev.find(p => p.id === item.id);
      if (ex) {
        const newQty = ex.qty + delta;
        if (newQty <= 0) return prev.filter(p => p.id!== item.id);
        return prev.map(p => p.id === item.id? {...p, qty: newQty } : p);
      } else {
        if (delta > 0) return [...prev, {...item, qty: delta }];
        return prev;
      }
    });
  };

  const clearCart = () => setCart([]);

  const placeOnlineOrder = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      orders: [...cart],
      total: cart.reduce((s,i)=>s+i.price*i.qty,0),
      status: "new"
    };
    setOnlineOrders(prev => [newOrder,...prev]);
    setCart([]);
  };

  const clearOnlineOrder = (id) => {
    setOnlineOrders(prev => prev.filter(o => o.id!== id));
  };

  return (
    <CartContext.Provider value={{
      cart, cartItems: cart,
      addToCart, clearCart,
      onlineOrders, placeOnlineOrder, clearOnlineOrder
    }}>
      {children}
    </CartContext.Provider>
  );
}