import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { canSee, can } from "../../roles";
import { PageTitle } from "./ui";
import { Toast } from "./Ticket";
import RoomsTab from "../admin/RoomsTab";
import BookingModal from "../../components/BookingModal";
import { printBookingInvoice } from "../../printBill";
import { inr2, pct } from "../../gst";

const STATUS_STYLE = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-600",
};

// Room bookings list (super admin, manager and reception / front desk).
export function Bookings() {
  const { user, logout } = useAuth();
  const canStatus = can(user?.role, "BOOKING_STATUS"); // confirm / complete / cancel
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmed, setConfirmed] = useState(null); // booking just confirmed -> big notice
  const [newOpen, setNewOpen] = useState(false);
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
      const b = await apiFetch(`/api/bookings/${id}/status?status=${status}`, { method: "PATCH" });
      if (status === "CONFIRMED") setConfirmed(b);
      else flash(`✅ Booking #${id} is now ${status}`);
      load();
    } catch (e) {
      flash("⚠️ " + e.message);
    }
  };

  return (
    <div>
      <Toast msg={msg} />
      {confirmed && (
        <div role="status" className="mb-4 flex items-start justify-between gap-3 bg-green-50 border-2 border-green-400 text-green-900 px-5 py-4 rounded-xl">
          <div>
            <p className="font-bold text-lg">✅ Booking #{confirmed.id} confirmed</p>
            <p className="text-sm mt-1">
              {confirmed.guestName} · {confirmed.room?.name || "Room"} {confirmed.room?.roomNumber} · {confirmed.checkIn} → {confirmed.checkOut}
              {" "}· {confirmed.numberOfGuests} guest{confirmed.numberOfGuests > 1 ? "s" : ""}
            </p>
            <p className="text-xs mt-1 text-green-800">Contact: {confirmed.phone} · {confirmed.email}</p>
          </div>
          <button onClick={() => setConfirmed(null)} aria-label="Close" className="text-xl leading-none px-2">×</button>
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <button onClick={() => setNewOpen(true)} className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">＋ New booking</button>
      </div>
      <BookingModal isOpen={newOpen} onClose={() => { setNewOpen(false); load(); }} />
      {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">#</th><th className="p-3">Guest</th><th className="p-3">Room</th><th className="p-3">Stay</th><th className="p-3">Guests</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan="8" className="p-6 text-center text-gray-400">No bookings yet</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3">{b.id}</td>
                <td className="p-3"><div className="font-semibold">{b.guestName}</div><div className="text-xs text-gray-500">{b.phone} · {b.email}</div></td>
                <td className="p-3">{b.room?.name || "Room"} ({b.room?.roomNumber})</td>
                <td className="p-3">{b.checkIn} → {b.checkOut}</td>
                <td className="p-3">{b.numberOfGuests}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {b.grandTotal != null ? (
                    <>
                      <div className="font-bold">{inr2(b.grandTotal)}</div>
                      {b.taxAmount > 0 && <div className="text-[11px] text-gray-500">incl. GST {pct(b.gstRate)} {inr2(b.taxAmount)}</div>}
                    </>
                  ) : <span className="text-xs text-gray-400">-</span>}
                </td>
                <td className="p-3">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_STYLE[b.status] || ""}`}>{b.status}</span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  {canStatus && b.status === "PENDING" && <button onClick={() => setStatus(b.id, "CONFIRMED")} className="mr-2 px-3 py-1 bg-[#1F3B2D] text-white rounded-lg text-xs font-bold">Confirm</button>}
                  {canStatus && b.status === "CONFIRMED" && <button onClick={() => setStatus(b.id, "COMPLETED")} className="mr-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold">Complete</button>}
                  {canStatus && (b.status === "PENDING" || b.status === "CONFIRMED") && (
                    <button onClick={() => window.confirm("Cancel this booking?") && setStatus(b.id, "CANCELLED")} className="mr-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
                  )}
                  {b.status !== "CANCELLED" && (
                    <button onClick={() => printBookingInvoice(b)} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold">🖨️ Invoice</button>
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
  const { user } = useAuth();
  const superAdmin = canSee(user?.role, "rooms"); // the Rooms tab needs the "Rooms set-up" permission
  const btn = (id) =>
    `px-5 py-2 rounded-full text-sm font-semibold border ${tab === id ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white text-gray-700"}`;
  return (
    <div>
      <PageTitle title="Reservation" sub={superAdmin ? "Room bookings and the rooms guests can book" : "Room bookings"} />
      {superAdmin && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("bookings")} className={btn("bookings")}>Bookings</button>
          <button onClick={() => setTab("rooms")} className={btn("rooms")}>Rooms</button>
        </div>
      )}
      {tab === "bookings" || !superAdmin ? <Bookings /> : <RoomsTab />}
    </div>
  );
}
