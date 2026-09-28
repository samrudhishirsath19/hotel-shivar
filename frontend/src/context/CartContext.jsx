import { createContext, useState, useContext, useEffect } from "react";
const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(()=>{
    const saved = localStorage.getItem("shivar_cart");
    return saved? JSON.parse(saved) : [];
  });

  useEffect(()=>{
    localStorage.setItem("shivar_cart", JSON.stringify(cart));
  },[cart]);

  const addToCart = (item, qty) => {
    const q = qty || 1;
    setCart(prev => {
      const ex = prev.find(c=>c.id===item.id);
      return ex? prev.map(c=>c.id===item.id?{...c, qty: c.qty+q}:c) : [...prev, {...item, qty:q}];
    });
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(c=>c.id!==id));
  const updateCartQty = (id, newQty) => {
    if(newQty<=0) return removeFromCart(id);
    setCart(prev => prev.map(c=>c.id===id?{...c, qty:newQty}:c));
  };
  const clearCart = () => setCart([]);
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const count = cart.reduce((s,i)=>s+i.qty,0);

  return (
    <CartContext.Provider value={{cart, addToCart, removeFromCart, updateCartQty, clearCart, total, count}}>
      {children}
    </CartContext.Provider>
  );
}