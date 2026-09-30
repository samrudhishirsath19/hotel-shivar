import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTables } from "../context/TableContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const [tab, setTab] = useState("menu");
  const { currentUser, logout } = useAuth();
  const { tables } = useTables();
  const { onlineOrders } = useCart();
  const nav = useNavigate();

  const [vegCats, setVegCats] = useState(["Breakfast", "Starter Veg", "Veg Bhaji", "Veg Rice", "Roti Chapati", "Dessert", "Water Bottle"]);
  const [nonVegCats, setNonVegCats] = useState(["Starter Non-Veg", "Non-Veg Bhaji", "Non-Veg Rice", "Roti Chapati", "Dessert"]);
  const [newCat, setNewCat] = useState({ name: "", type: "veg" });

  const handleAddCat = () => {
    if (!newCat.name.trim()) return alert("Enter category name");
    if (newCat.type === "veg") setVegCats([...vegCats, newCat.name]);
    else setNonVegCats([...nonVegCats, newCat.name]);
    setNewCat({ name: "", type: "veg" });
  };

  if (!currentUser || (currentUser.role!== "manager" && currentUser.role!== "superadmin")) {
    return <div className="p-20 text-center font-bold">Access Denied - Manager Only</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-[#1F3B2D] text-white p-4 fixed h-full flex flex-col justify-between">
        <div>
          <h2 className="font-bold text-xl">Manager Panel</h2>
          <p className="text-[11px] text-white/60 mb-6">{currentUser.name}</p>
          <button onClick={() => setTab("menu")} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 text-sm ${tab === "menu"? "bg-[#B8893C]" : "hover:bg-white/10"}`}>Menu Category</button>
          <button onClick={() => setTab("kot")} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 text-sm ${tab === "kot"? "bg-[#B8893C]" : "hover:bg-white/10"}`}>KOT Orders</button>
          <button onClick={() => setTab("tables")} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 text-sm ${tab === "tables"? "bg-[#B8893C]" : "hover:bg-white/10"}`}>Tables</button>
        </div>
        <div className="border-t border-white/10 pt-4">
          <button onClick={() => nav("/")} className="w-full bg-white/10 py-2 rounded-lg text-sm mb-2">View Website</button>
          <button onClick={() => { logout(); nav("/login"); }} className="w-full bg-red-600 py-2 rounded-lg text-sm font-bold">Logout</button>
        </div>
      </div>

      <div className="ml-64 p-6 flex-1">
        {tab === "menu" && (
          <div>
            <h1 className="text-2xl font-bold">Menu Category Management</h1>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="bg-white p-5 rounded-xl border">
                <h3 className="font-bold mb-3 text-green-700">VEG CATEGORIES</h3>
                {vegCats.map((c, i) => <div key={i} className="flex justify-between border p-2.5 rounded-lg text-sm mb-2"><span>{c}</span><button onClick={() => setVegCats(vegCats.filter((_, idx) => idx!== i))} className="text-red-500 text-xs">Delete</button></div>)}
              </div>
              <div className="bg-white p-5 rounded-xl border">
                <h3 className="font-bold mb-3 text-red-700">NON-VEG CATEGORIES</h3>
                {nonVegCats.map((c, i) => <div key={i} className="flex justify-between border p-2.5 rounded-lg text-sm mb-2"><span>{c}</span><button onClick={() => setNonVegCats(nonVegCats.filter((_, idx) => idx!== i))} className="text-red-500 text-xs">Delete</button></div>)}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border mt-6 flex gap-3 items-end">
              <div className="flex-1"><label className="text-xs font-bold">New Category Name</label><input value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value })} placeholder="e.g. Veg Starter" className="w-full border p-2.5 rounded-lg mt-1" /></div>
              <select value={newCat.type} onChange={e => setNewCat({...newCat, type: e.target.value })} className="border p-2.5 rounded-lg"><option value="veg">Veg</option><option value="nonveg">Non-Veg</option></select>
              <button onClick={handleAddCat} className="bg-[#1F3B2D] text-white px-6 py-2.5 rounded-lg font-bold">Add Category</button>
            </div>
          </div>
        )}
        {tab === "kot" && <div><h1 className="text-2xl font-bold">Live KOT</h1><div className="mt-4">{onlineOrders.length} orders</div></div>}
        {tab === "tables" && <div><h1 className="text-2xl font-bold">Tables</h1><div className="grid grid-cols-5 gap-3 mt-6">{Object.entries(tables).map(([no, data]) => <div key={no} className="p-4 rounded-xl text-center border bg-white">T{no} - {data.status}</div>)}</div></div>}
      </div>
    </div>
  );
}