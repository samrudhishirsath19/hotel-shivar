import { useState, useEffect } from "react";
import { apiFetch } from "../api";

const blank = { roomId: "", name: "", email: "", mobile: "", checkIn: "", checkOut: "", guests: 1 };

export default function BookingModal({ isOpen, onClose, roomName = "" }) {
  const [form, setForm] = useState(blank);
  const [rooms, setRooms] = useState([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // load the rooms each time the window opens; pre-select the room the guest clicked "Book Now" on
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    apiFetch("/api/rooms?availableOnly=true")
      .then((list) => {
        setRooms(list || []);
        const match = (list || []).find((r) => r.name === roomName);
        setForm((f) => ({ ...f, roomId: match ? String(match.id) : f.roomId }));
      })
      .catch(() => setError("Could not load rooms. Please check that the backend is running."));
  }, [isOpen, roomName]);

  if (!isOpen) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const today = new Date().toISOString().slice(0, 10);

  const handleBooking = async () => {
    setError("");
    if (!form.roomId || !form.name.trim() || !form.email.trim() || !form.mobile.trim() || !form.checkIn || !form.checkOut) {
      setError("Please fill all the details.");
      return;
    }
    if (form.checkOut <= form.checkIn) {
      setError("Check-out date must be after the check-in date.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          roomId: Number(form.roomId),
          guestName: form.name.trim(),
          email: form.email.trim(),
          phone: form.mobile.trim(),
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          numberOfGuests: Number(form.guests),
        }),
      });
      setDone(true);
      setTimeout(() => {
        onClose();
        setDone(false);
        setForm(blank);
      }, 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "mt-1 w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white w-full md:max-w-lg rounded-t-[24px] md:rounded-2xl shadow-2xl p-6 md:p-8 max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">✕</button>

        {!done ? (
          <>
            <h2 className="font-serif text-2xl text-[#1F3B2D]">Book your stay</h2>
            <p className="text-sm text-gray-500">Hotel Shivar, Kamshet</p>

            {error && <p role="alert" className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Room</label>
                <select value={form.roomId} onChange={set("roomId")} className={inputCls + " bg-white"}>
                  <option value="">Choose a room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {(r.name || "Room " + r.roomNumber)} - ₹{Number(r.pricePerNight).toLocaleString("en-IN")} / night
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input value={form.name} onChange={set("name")} placeholder="Your name" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium">Mobile number</label>
                  <input value={form.mobile} onChange={set("mobile")} placeholder="98XXXXXXXX" inputMode="tel" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Check-in</label>
                  <input type="date" min={today} value={form.checkIn} onChange={set("checkIn")} className="mt-1 w-full border rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Check-out</label>
                  <input type="date" min={form.checkIn || today} value={form.checkOut} onChange={set("checkOut")} className="mt-1 w-full border rounded-xl px-4 py-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Guests</label>
                <select value={form.guests} onChange={set("guests")} className={inputCls + " bg-white"}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </div>

              <button onClick={handleBooking} disabled={busy} className="w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-60">
                {busy ? "Sending..." : "Request booking"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
            <h3 className="font-serif text-2xl text-[#1F3B2D] mt-4">Booking Sent!</h3>
            <p className="text-sm text-gray-500 mt-2">Hotel will contact you soon to confirm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
