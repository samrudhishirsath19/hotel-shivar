import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar({ onBookNow }) {
  const { cart } = useCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <nav className="bg-[#1F3B2D] text-white px-6 py-3 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
      <Link to="/home" className="font-serif text-xl font-bold">Hotel Shivar</Link>

      <div className="hidden md:flex gap-5 text-sm font-medium items-center">
        <Link to="/home" className="hover:text-[#B8893C]">Home</Link>
        <Link to="/rooms" className="hover:text-[#B8893C]">Rooms</Link>
        <Link to="/gallery" className="hover:text-[#B8893C]">Gallery</Link>
        <Link to="/restaurant" className="hover:text-[#B8893C]">Restaurant</Link>
        <Link to="/banquet" className="hover:text-[#B8893C]">Banquet</Link>
        <Link to="/offers" className="hover:text-[#B8893C]">Offers</Link>
        <Link to="/about" className="hover:text-[#B8893C]">About</Link>
        <Link to="/contact" className="hover:text-[#B8893C]">Contact</Link>
      </div>

      <div className="flex gap-2 items-center">
        <Link to="/restaurant" className="bg-white/10 px-4 py-1.5 rounded-full text-sm font-bold border border-white/10">
          Cart {count > 0? `(${count})` : ""}
        </Link>
        <button onClick={onBookNow} className="bg-[#B8893C] px-4 py-1.5 rounded-full text-sm font-bold">
          Book Now
        </button>
      </div>
    </nav>
  );
}