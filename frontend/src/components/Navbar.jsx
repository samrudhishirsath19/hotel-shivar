import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/rooms", label: "Rooms" },
  { to: "/gallery", label: "Gallery" },
  { to: "/restaurant", label: "Restaurant" },
  { to: "/banquet", label: "Banquet" },
  { to: "/offers", label: "Offers" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar({ onBookNow }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, total, count, removeFromCart, updateCartQty, clearCart } = useCart();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm transition-colors ${
      isActive ? "text-[#D9B26A] font-semibold" : "text-white/90 hover:text-white"
    }`;

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#1F3B2D] shadow">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl text-white tracking-wide">
          Hotel Shivar
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden md:block border border-white/30 text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/10">
            Login
          </Link>
          <Link to="/signup" className="hidden md:block bg-white text-[#1F3B2D] text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-100">
            Sign Up
          </Link>

          {/* CART BUTTON - NAVBAR MADHE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCartOpen(!cartOpen)}
              className="relative bg-[#B8893C] hover:bg-[#9E7430] text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1"
            >
              🛒 Cart {count > 0 && <span className="bg-white text-[#1F3B2D] text-[11px] font-bold px-1.5 rounded-full">{count}</span>}
            </button>

            {cartOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl p-4 z-50 border max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-[#1F3B2D]">Your Cart - ₹{total}</h3>
                  <button onClick={() => setCartOpen(false)} className="text-xl leading-none">×</button>
                </div>

                {cart.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Cart is empty</p>
                ) : (
                  <>
                    {cart.map((c) => (
                      <div key={c.id} className="flex justify-between items-center py-2 border-b gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1F3B2D]">{c.name}</p>
                          <p className="text-xs text-gray-500">₹{c.price} x {c.qty} = ₹{c.price * c.qty}</p>
                        </div>
                        <div className="flex items-center gap-1 border rounded-md">
                          <button onClick={() => updateCartQty(c.id, c.qty - 1)} className="px-2 py-0.5">-</button>
                          <span className="text-xs w-4 text-center">{c.qty}</span>
                          <button onClick={() => updateCartQty(c.id, c.qty + 1)} className="px-2 py-0.5">+</button>
                        </div>
                        <button onClick={() => removeFromCart(c.id)} className="text-red-500 text-[11px] font-bold px-1">✕</button>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold mt-3 text-[#1F3B2D]">
                      <span>Total</span><span className="text-[#B8893C]">₹{total}</span>
                    </div>
                    <button
                      onClick={() => {
                        const msg = cart.map(c=>`${c.name} x ${c.qty} = ₹${c.price*c.qty}`).join('\n')+`\n\nTotal: ₹${total}`;
                        window.open(`https://wa.me/919999999999?text=${encodeURIComponent(msg)}`,"_blank");
                      }}
                      className="w-full mt-3 bg-[#1F3B2D] text-white py-2.5 rounded-xl text-sm font-semibold"
                    >
                      Place Order
                    </button>
                    <button onClick={clearCart} className="w-full mt-2 text-xs text-gray-500 hover:text-red-500">Clear All / Cancel</button>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onBookNow}
            className="bg-[#B8893C] hover:bg-[#9E7430] text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Book Now
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="lg:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden bg-[#1F3B2D] border-t border-white/10 px-4 pb-4 flex flex-col">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkClass} onClick={() => setMenuOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
            <Link to="/login" className="flex-1 border border-white/30 text-white text-sm px-4 py-2 rounded-full text-center" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/signup" className="flex-1 bg-white text-[#1F3B2D] text-sm font-semibold px-4 py-2 rounded-full text-center" onClick={() => setMenuOpen(false)}>Sign Up</Link>
          </div>
          {cart.length>0 && (
            <div className="mt-3 bg-white rounded-xl p-3">
              <p className="font-bold text-sm">Cart: ₹{total} ({count} items)</p>
              <button onClick={()=>{setMenuOpen(false); setCartOpen(true);}} className="w-full mt-2 bg-[#1F3B2D] text-white py-2 rounded-lg text-sm">View Cart</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}