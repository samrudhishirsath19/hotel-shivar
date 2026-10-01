import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { PageTitle } from "./ui";
import { Toast } from "./Ticket";
import RoomsTab from "../admin/RoomsTab";

const STATUS_STYLE = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-600",
};

function Bookings() {
  const { logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3500); };

  const load = useCallback(async () => {
    try {
      const list = await apiFetch("/api/bookings");
      setBookings((list || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
      setError("");
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [logout]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await apiFetch(`/api/bookings/${id}/status?status=${status}`, { method: "PATCH" });
      flash(`✅ Booking #${id} is now ${status}`);
      load();
    } catch (e) {
      flash("⚠️ " + e.message);
    }
  };

  return (
    <div>
      <Toast msg={msg} />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">#</th><th className="p-3">Guest</th><th className="p-3">Room</th><th className="p-3">Stay</th><th className="p-3">Guests</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-gray-400">No bookings yet</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3">{b.id}</td>
                <td className="p-3"><div className="font-semibold">{b.guestName}</div><div className="text-xs text-gray-500">{b.phone} · {b.email}</div></td>
                <td className="p-3">{b.room?.name || "Room"} ({b.room?.roomNumber})</td>
                <td className="p-3">{b.checkIn} → {b.checkOut}</td>
                <td className="p-3">{b.numberOfGuests}</td>
                <td className="p-3"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_STYLE[b.status] || ""}`}>{b.status}</span></td>
                <td className="p-3 whitespace-nowrap">
                  {b.status === "PENDING" && <button onClick={() => setStatus(b.id, "CONFIRMED")} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Confirm</button>}
                  {b.status === "CONFIRMED" && <button onClick={() => setStatus(b.id, "COMPLETED")} className="mr-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold">Complete</button>}
                  {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                    <button onClick={() => window.confirm("Cancel this booking?") && setStatus(b.id, "CANCELLED")} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReservationPage() {
  const [tab, setTab] = useState("bookings");
  const btn = (id) =>
    `px-5 py-2 rounded-full text-sm font-semibold border ${tab === id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white text-gray-700"}`;
  return (
    <div>
      <PageTitle title="Reservation" sub="Room bookings and the rooms guests can book" />
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("bookings")} className={btn("bookings")}>Bookings</button>
        <button onClick={() => setTab("rooms")} className={btn("rooms")}>Rooms</button>
      </div>
      {tab === "bookings" ? <Bookings /> : <RoomsTab />}
    </div>
  );
}
