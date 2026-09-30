import { Link } from "react-router-dom";

const links = [
  { to: "/rooms", label: "Rooms" },
  { to: "/restaurant", label: "Restaurant" },
  { to: "/banquet", label: "Banquet" },
  { to: "/offers", label: "Offers" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

// Shown at the bottom of every page of the website (login and manager pages too).
export default function Footer() {
  return (
    <footer className="bg-[#1F3B2D] text-white/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-serif text-2xl text-white">Hotel Shivar</h3>
          <p className="mt-2 text-sm text-[#D9B26A] tracking-wide">Kamshet • Lonavala • Pune</p>
          <p className="mt-3 text-sm text-white/70">Comfortable rooms, good food and a warm stay in the hills.</p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Quick links</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-[#D9B26A]">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="tel:+919876543210" className="hover:text-[#D9B26A]">+91 98765 43210</a></li>
            <li><a href="mailto:stay@hotelshivar.com" className="hover:text-[#D9B26A]">stay@hotelshivar.com</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
          <span>© {new Date().getFullYear()} Hotel Shivar. All rights reserved.</span>
          <Link to="/login" className="hover:text-[#D9B26A]">Staff Login</Link>
        </div>
      </div>
    </footer>
  );
}
