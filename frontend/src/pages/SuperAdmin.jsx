import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTables } from "../context/TableContext";
import { useCart } from "../context/CartContext";

export default function SuperAdmin() {
  const [tab, setTab] = useState("dashboard");
  const { users, createUser, deleteUser, currentUser, logout } = useAuth();
  const { tables, rooms } = useTables();
  const { onlineOrders } = useCart();
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "waiter", name: "" });
  const nav = useNavigate();

  if (currentUser?.role!== "superadmin") {
    return (
      <div className="p-20 text-center font-bold">
        Only Super Admin can access this page. Login as superadmin / admin@123
        <br />
        <button onClick={() => nav("/login")} className="mt-4 bg-[#1F3B2D] text-white px-4 py-2 rounded">
          Go to Login
        </button>
      </div>
    );
  }

  const tabs = ["dashboard", "KOT", "menu", "tables", "reservation", "billing", "inventory", "purchase", "staff", "users"];

  // Delete with confirm
  const handleDelete = (id) => {
    if(window.confirm("Khara delete karaycha ka?")){
      deleteUser(id);
    }
  }

  // Create with validation
  const handleCreate = () => {
    if (!newUser.name ||!newUser.username ||!newUser.password) {
      return alert("Full Name, Username aani Password bhara!");
    }
    if(newUser.username.length < 3){
      return alert("Username kamit kami 3 aksharacha hava");
    }
    createUser(newUser);
    setNewUser({ username: "", password: "", role: "waiter", name: "" });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#1F3B2D] text-white p-4 fixed h-full flex flex-col justify-between">
        <div>
          <h2 className="font-bold text-xl mb-1">Hotel Shivar</h2>
          <p className="text-[11px] text-white/60 mb-6">Super Admin Panel</p>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 capitalize text-sm font-medium transition ${
                tab === t? "bg-[#B8893C] text-white shadow" : "hover:bg-white/10 text-white/80"
              }`}
            >
              {t === 'KOT'? '🔥 KOT' : t}
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 pt-4">
          <button onClick={() => nav("/home")} className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm mb-2">
            View Website
          </button>
          <button
            onClick={() => { logout(); nav("/login"); }}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm font-bold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6 flex-1">
        {tab === "dashboard" && (
          <div>
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-sm text-gray-500">Occupied Tables</p>
                <h2 className="text-3xl font-bold mt-1">{Object.values(tables).filter((t) => t.status === "occupied").length} / {Object.keys(tables).length}</h2>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-sm text-gray-500">Online Orders</p>
                <h2 className="text-3xl font-bold mt-1 text-blue-600">{onlineOrders.length}</h2>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-sm text-gray-500">Today's Revenue</p>
                <h2 className="text-3xl font-bold mt-1 text-green-600">₹{onlineOrders.reduce((s, o) => s + o.total, 0)}</h2>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-sm text-gray-500">Pending KOT</p>
                <h2 className="text-3xl font-bold mt-1 text-orange-600">{onlineOrders.length}</h2>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mt-6 text-sm">
              Tip: Frontend Mock Data chalu aahe. Suhani/Sakshi API dilya var `AuthContext` madhe fakt API call jodel.
            </div>
          </div>
        )}

        {tab === "KOT" && (
          <div>
            <h1 className="text-2xl font-bold">Live KOT - Customer Orders</h1>
            {onlineOrders.length === 0? (
              <div className="bg-white mt-6 p-8 rounded-xl border text-center text-gray-400">No online orders yet. Add items from /restaurant</div>
            ) : (
              <div className="grid grid-cols-3 gap-4 mt-6">
                {onlineOrders.map((order) => (
                  <div key={order.id} className="bg-white border-l-4 border-orange-500 p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold">Order #{order.id.toString().slice(-4)}</h3>
                    <p className="text-xs text-gray-500">{new Date(order.time).toLocaleTimeString()}</p>
                    <div className="mt-2">
                      {order.orders.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span>{item.name} x {item.qty}</span>
                          <span>Rs.{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="font-bold mt-2 border-t pt-2">Total: Rs.{order.total}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold mb-4">Users & Role</h1>
            <div className="bg-white p-5 rounded-xl border shadow-sm mb-6">
              <h3 className="font-bold mb-3 text-[#1F3B2D]">Create New Login</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Full Name *" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-[#B8893C] outline-none" />
                <input placeholder="Username *" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-[#B8893C] outline-none" />
                <input type="password" placeholder="Password *" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-[#B8893C] outline-none" />
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value })} className="border p-2.5 rounded-lg">
                  <option value="waiter">Waiter</option>
                  <option value="chef">Chef / Kitchen Staff</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
              <button onClick={handleCreate} className="mt-4 bg-[#1F3B2D] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2a4e3b] transition">
                + Create Login
              </button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm divide-y">
              <div className="p-3 bg-gray-50 rounded-t-xl text-xs font-bold text-gray-500">TOTAL USERS: {users.length}</div>
              {users.map((u) => (
                <div key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-bold">{u.name} - <span className="text-[#B8893C] capitalize">{u.role}</span></p>
                    <p className="text-xs text-gray-500 mt-1">ID: {u.username} | Pass: {u.password}</p>
                  </div>
                  <button onClick={() => handleDelete(u.id)} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "tables" && (
          <div>
            <h1 className="text-2xl font-bold">Tables - {Object.keys(tables).length} Tables</h1>
            <div className="grid grid-cols-5 gap-4 mt-6">
              {Object.values(tables).map(t => (
                <div key={t.id} className={`p-6 rounded-xl border-2 text-center font-bold ${t.status === 'occupied'? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'}`}>
                  Table {t.id}<br/><span className="text-xs">{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {["menu", "reservation", "billing", "inventory", "purchase", "staff"].includes(tab) && (
          <div>
            <h1 className="text-2xl font-bold capitalize">{tab} Management</h1>
            <div className="bg-white mt-6 p-8 rounded-xl border text-center text-gray-400">Coming soon - Samrudhi is working on this</div>
          </div>
        )}
      </div>
    </div>
  );
}