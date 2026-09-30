import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../roles";
import SalesTab from "./admin/SalesTab";
import MenuTab from "./admin/MenuTab";
import RoomsTab from "./admin/RoomsTab";
import UsersTab from "./admin/UsersTab";

const TABS = [
  { id: "sales", label: "📊 Sales" },
  { id: "menu", label: "🍽️ Menu items" },
  { id: "rooms", label: "🛏️ Rooms" },
  { id: "users", label: "👥 Users & departments" },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("sales");

  return (
    <div className="bg-[#FFFBF5] min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#1F3B2D]">Super Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">{user?.name} · {roleLabel(user?.role)} · {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/manager" className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">Manager view</Link>
            <button onClick={logout} className="px-5 py-2 rounded-full bg-red-100 text-red-700 text-sm font-bold">Logout</button>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold border ${tab === t.id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "sales" && <SalesTab />}
          {tab === "menu" && <MenuTab />}
          {tab === "rooms" && <RoomsTab />}
          {tab === "users" && <UsersTab />}
        </div>
      </div>
    </div>
  );
}
