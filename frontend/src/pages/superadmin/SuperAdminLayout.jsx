import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/super-admin", label: "Dashboard", end: true },
  { to: "/super-admin/kot", label: "KOT", icon: "🔥" },
  { to: "/super-admin/menu", label: "Menu" },
  { to: "/super-admin/tables", label: "Tables" },
  { to: "/super-admin/reservation", label: "Reservation" },
  { to: "/super-admin/billing", label: "Billing" },
  { to: "/super-admin/inventory", label: "Inventory" },
  { to: "/super-admin/purchase", label: "Purchase" },
  { to: "/super-admin/staff", label: "Staff" },
  { to: "/super-admin/users", label: "Users" },
];

// Full-screen admin panel: green sidebar on the left, page on the right (no website navbar).
export default function SuperAdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const itemCls = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[15px] transition-colors ${
      isActive ? "bg-[#B8893C] text-white font-medium" : "text-white/90 hover:bg-white/10"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* phone: top bar with a menu button */}
      <div className="md:hidden flex items-center justify-between bg-[#1F3B2D] text-white px-4 h-14">
        <span className="font-bold text-lg">Hotel Shivar</span>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="text-2xl leading-none px-2">
          {open ? "✕" : "☰"}
        </button>
      </div>

      <aside
        className={`${open ? "flex" : "hidden"} md:flex flex-col md:w-[267px] md:shrink-0 md:sticky md:top-0 md:h-screen bg-[#1F3B2D] text-white px-4 py-5 overflow-y-auto`}
      >
        <div className="px-1">
          <h2 className="text-xl font-bold leading-tight">Hotel Shivar</h2>
          <p className="text-xs text-white/70 mt-1">Super Admin Panel</p>
        </div>

        <nav className="mt-7 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={itemCls} onClick={() => setOpen(false)}>
              {n.icon && <span className="text-sm">{n.icon}</span>}
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
          <Link to="/" className="block text-center py-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium">
            View Website
          </Link>
          <button onClick={doLogout} className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 pt-8">
        <Outlet />
      </main>
    </div>
  );
}
