import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../api";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

// v2: the cart now holds real menu ids from the backend (old carts would point to items that no longer exist)
const KEY = "shivar_cart_v2";
// tracking code of the customer's last online order (for the "Track my order" link)
export const LAST_ORDER_KEY = "shivar_last_order";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* storage blocked */ }
  }, [cart]);

  // keep two open tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) {
        try { setCart(JSON.parse(e.newValue || "[]")); } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // item = { id, name, price }, delta = +1 / -1
  const addToCart = (item, delta) => {
    setCart((prev) => {
      const ex = prev.find((p) => p.id === item.id);
      if (ex) {
        const newQty = ex.qty + delta;
        if (newQty <= 0) return prev.filter((p) => p.id !== item.id);
        return prev.map((p) => (p.id === item.id ? { ...p, qty: newQty } : p));
      }
      if (delta > 0) return [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: delta }];
      return prev;
    });
  };

  const updateCartQty = (id, qty) =>
    setCart((prev) => (qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, qty } : p))));

  const removeFromCart = (id) => setCart((prev) => prev.filter((p) => p.id !== id));
  const clearCart = () => setCart([]);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  // Sends the cart to the backend as a delivery order (Placed, payment pending).
  // details = { customerName, customerPhone, deliveryAddress, deliveryNote, paymentMethod }
  const placeOnlineOrder = async (details) => {
    const order = await apiFetch("/api/orders/online", {
      method: "POST",
      body: JSON.stringify({
        ...details,
        items: cart.map((c) => ({ menuItemId: c.id, quantity: c.qty })),
      }),
    });
    setCart([]);
    try { localStorage.setItem(LAST_ORDER_KEY, order.trackingCode); } catch { /* storage blocked */ }
    return order;
  };

  return (
    <CartContext.Provider
      value={{ cart, cartItems: cart, total, count, addToCart, updateCartQty, removeFromCart, clearCart, placeOnlineOrder }}
    >
      {children}
    </CartContext.Provider>
  );
}
