import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SECTIONS, canSee, panelBase, panelName } from "../../roles";
import { PanelContext } from "./panelContext";

// Full-screen admin panel: green sidebar on the left, page on the right (no website navbar).
export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const base = panelBase(role);
  // only the sections that belong to this department
  // only the sections this department may use (fixed pages + modules granted on Module Access)
  const NAV = SECTIONS.filter((s) => !s.hidden && canSee(role, s.id)).map((s) => ({
    to: s.id === "dashboard" ? base : `${base}/${s.id}`,
    label: s.label,
    icon: s.icon,
    end: s.id === "dashboard",
  }));
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const itemCls = ({ isActive }) =>
    // items share the height of the sidebar, but never get smaller than 36px; if they do not fit,
    // the menu scrolls instead of the last items running into "View Website"
    `flex shrink-0 items-center gap-2 px-3.5 py-2 md:py-0 md:flex-1 md:min-h-[36px] md:max-h-[46px] rounded-lg text-[15px] transition-colors ${
      isActive ? "bg-[#B8893C] text-white font-medium" : "text-white/90 hover:bg-white/10"
    }`;

  return (
    <PanelContext.Provider value={{ base, role }}>
    <div className="min-h-screen bg-gray-50 md:flex md:h-screen md:overflow-hidden">
      {/* phone: top bar with a menu button */}
      <div className="md:hidden flex items-center justify-between bg-[#1F3B2D] text-white px-4 h-14">
        <span className="font-bold text-lg">Hotel Shivar</span>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="text-2xl leading-none px-2">
          {open ? "✕" : "☰"}
        </button>
      </div>

      <aside
        className={`${open ? "flex" : "hidden"} md:flex flex-col md:w-[267px] md:shrink-0 md:h-screen bg-[#1F3B2D] text-white px-4 py-4 md:overflow-hidden`}
      >
        <div className="px-1">
          <h2 className="text-xl font-bold leading-tight">Hotel Shivar</h2>
          <p className="text-xs text-white/70 mt-1">{panelName(role)}</p>
          {role !== "SUPER_ADMIN" && user?.name && <p className="text-[11px] text-white/50 truncate">{user.name}</p>}
        </div>

        <nav className="mt-5 flex flex-col gap-1 md:flex-1 md:min-h-0 md:overflow-y-auto md:-mr-2 md:pr-2">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={itemCls} onClick={() => setOpen(false)}>
              {n.icon && <span className="text-sm">{n.icon}</span>}
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-2 md:mt-auto pt-3 border-t border-white/10 space-y-2">
          <Link to="/" className="block text-center py-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium">
            View Website
          </Link>
          <button onClick={doLogout} className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold">
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col md:h-screen">
        <main className="flex-1 min-h-0 md:overflow-y-auto p-6 pt-6">
          <Outlet />
        </main>
      </div>
    </div>
    </PanelContext.Provider>
  );
}
