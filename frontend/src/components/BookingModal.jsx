import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { groupRooms } from "../roomGroups";
import { digits10, isPhone10, PHONE_ERROR } from "../roles";
<<<<<<< HEAD
import { useGst, calcTax, roomRate, taxOf, inr2, pct } from "../gst";
=======
>>>>>>> origin/sakshi

const blank = { category: "", roomId: "", name: "", email: "", mobile: "", checkIn: "", checkOut: "", guests: 1 };

export default function BookingModal({ isOpen, onClose, roomName = "" }) {
  const [form, setForm] = useState(blank);
  const [rooms, setRooms] = useState([]);
  const [occupied, setOccupied] = useState([]);
  const [booking, setBooking] = useState(null); // the confirmed booking -> confirmation screen
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // load the rooms each time the window opens; pre-select the category the guest clicked "Book Now" on
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    apiFetch("/api/rooms?availableOnly=true")
      .then((list) => {
        setRooms(list || []);
        const match = (list || []).find((r) => (r.name || "").trim().toLowerCase() === roomName.trim().toLowerCase());
        if (match) setForm((f) => ({ ...f, category: match.name.trim().replace(/\s+/g, " ").toLowerCase(), roomId: "" }));
      })
      .catch(() => setError("Could not load rooms. Please check that the backend is running."));
  }, [isOpen, roomName]);

  // which rooms are already booked for the chosen dates (tonight until dates are picked)
  useEffect(() => {
    if (!isOpen) return;
    const q = form.checkIn && form.checkOut && form.checkOut > form.checkIn ? `?checkIn=${form.checkIn}&checkOut=${form.checkOut}` : "";
    apiFetch("/api/rooms/occupied" + q).then((ids) => setOccupied(ids || [])).catch(() => setOccupied([]));
  }, [isOpen, form.checkIn, form.checkOut]);

  const groups = groupRooms(rooms, occupied);
  const group = groups.find((g) => g.key === form.category);
<<<<<<< HEAD
  const gst = useGst();
  // price estimate: GST slab depends on the price of one room per night
  const chosen = group?.free.find((r) => String(r.id) === form.roomId);
  const stayNights = form.checkIn && form.checkOut && form.checkOut > form.checkIn
    ? Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000) : 0;
  const estimate = chosen && stayNights > 0
    ? calcTax(Number(chosen.pricePerNight) * stayNights, roomRate(gst, chosen.pricePerNight)) : null;
=======
>>>>>>> origin/sakshi

  // a chosen room that became unavailable for the new dates is cleared
  useEffect(() => {
    if (form.roomId && group && !group.free.some((r) => String(r.id) === form.roomId)) {
      setForm((f) => ({ ...f, roomId: "" }));
    }
  }, [group, form.roomId]);

  if (!isOpen) return null;

  const set = (key) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [key]: v })); };
  const today = new Date().toISOString().slice(0, 10);

  const close = () => {
    onClose();
    setBooking(null);
    setForm(blank);
  };

  const handleBooking = async () => {
    setError("");
    if (!form.roomId || !form.name.trim() || !form.email.trim() || !form.mobile.trim() || !form.checkIn || !form.checkOut) {
      setError("Please fill all the details.");
      return;
    }
    if (!isPhone10(form.mobile)) {
      setError(PHONE_ERROR);
      return;
    }
    if (form.checkOut <= form.checkIn) {
      setError("Check-out date must be after the check-in date.");
      return;
    }
    setBusy(true);
    try {
      const saved = await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          roomId: Number(form.roomId),
          guestName: form.name.trim(),
          email: form.email.trim(),
          phone: form.mobile,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          numberOfGuests: Number(form.guests),
        }),
      });
      setBooking(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "mt-1 w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none";
  const nights = booking ? Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div onClick={close} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white w-full md:max-w-lg rounded-t-[24px] md:rounded-2xl shadow-2xl p-6 md:p-8 max-h-[92vh] overflow-y-auto">
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">✕</button>

        {!booking ? (
          <>
            <h2 className="font-serif text-2xl text-[#1F3B2D]">Book your stay</h2>
            <p className="text-sm text-gray-500">Hotel Shivar, Kamshet</p>

            {error && <p role="alert" className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

            <div className="mt-6 space-y-4">
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
                <label className="text-sm font-medium">Room category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, roomId: "" })} className={inputCls + " bg-white"}>
                  <option value="">Choose a room type</option>
                  {groups.map((g) => (
                    <option key={g.key} value={g.key} disabled={g.fullyBooked}>
                      {g.name} - ₹{g.minPrice.toLocaleString("en-IN")} / night {g.fullyBooked ? "(Fully Booked)" : `(${g.free.length} available)`}
                    </option>
                  ))}
                </select>
              </div>
              {group && (
                group.fullyBooked ? (
                  <p className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-semibold">
                    {group.name} is fully booked / unavailable for these dates. Please choose other dates or another room type.
                  </p>
                ) : (
                  <div>
                    <label className="text-sm font-medium">Room number</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {group.free.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setForm({ ...form, roomId: String(r.id) })}
                          className={`px-4 py-2 rounded-xl border text-sm font-semibold ${form.roomId === String(r.id) ? "bg-[#1F3B2D] text-white border-[#1F3B2D]" : "bg-white"}`}
                        >
                          {r.roomNumber} · ₹{Number(r.pricePerNight).toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
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
                  <input
                    value={form.mobile}
                    onChange={(e) => { const v = digits10(e.target.value); setForm((f) => ({ ...f, mobile: v })); }}
                    placeholder="10-digit number"
                    inputMode="numeric"
                    className={inputCls}
                  />
                  {form.mobile && !isPhone10(form.mobile) && <p className="text-xs text-red-600 mt-1">Enter exactly 10 digits ({form.mobile.length}/10)</p>}
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

<<<<<<< HEAD
              {estimate && (
                <div className="rounded-xl bg-[#F3F5F1] px-4 py-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-600">Room {chosen.roomNumber}: {stayNights} night{stayNights > 1 ? "s" : ""} × {inr2(chosen.pricePerNight)}</span><span>{inr2(estimate.taxable)}</span></div>
                  {estimate.tax > 0 && (
                    <div className="flex justify-between text-gray-600"><span>GST {pct(estimate.rate)} (CGST {pct(estimate.rate / 2)} + SGST {pct(estimate.rate / 2)})</span><span>{inr2(estimate.tax)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-[#1F3B2D] border-t pt-1"><span>Total{estimate.tax > 0 ? " (incl. GST)" : ""}</span><span>{inr2(estimate.total)}</span></div>
                </div>
              )}

=======
>>>>>>> origin/sakshi
              <button onClick={handleBooking} disabled={busy || (group && group.fullyBooked)} className="w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-60">
                {busy ? "Booking..." : "Book now"}
              </button>
            </div>
          </>
        ) : (
          <div role="status" className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
            <h3 className="font-serif text-2xl text-[#1F3B2D] mt-4">Booking Confirmed!</h3>
            <p className="text-sm text-gray-600 mt-1">Thank you, {booking.guestName}. Your room is reserved.</p>

            <div className="mt-5 text-left bg-[#F3F5F1] rounded-xl p-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Booking ID</span><b>#{booking.id}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">Room</span><b>{booking.room?.name} · No. {booking.room?.roomNumber}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">Check-in</span><b>{booking.checkIn}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">Check-out</span><b>{booking.checkOut} ({nights} night{nights > 1 ? "s" : ""})</b></div>
              <div className="flex justify-between"><span className="text-gray-500">Guests</span><b>{booking.numberOfGuests}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">Mobile</span><b>{booking.phone}</b></div>
<<<<<<< HEAD
              {taxOf(booking, "roomCharges") && (
                <>
                  <div className="flex justify-between border-t pt-1.5"><span className="text-gray-500">Room charges</span><b>{inr2(booking.roomCharges)}</b></div>
                  {booking.taxAmount > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">GST {pct(booking.gstRate)} (CGST {inr2(booking.cgstAmount)} + SGST {inr2(booking.sgstAmount)})</span><b>{inr2(booking.taxAmount)}</b></div>
                  )}
                  <div className="flex justify-between text-base"><span className="text-gray-700 font-semibold">Total{booking.taxAmount > 0 ? " (incl. GST)" : ""}</span><b className="text-[#1F3B2D]">{inr2(booking.grandTotal)}</b></div>
                </>
              )}
=======
>>>>>>> origin/sakshi
            </div>
            <p className="text-xs text-gray-500 mt-3">Please keep your booking ID. Our front desk will call you on {booking.phone} if anything is needed.</p>
            <button onClick={close} className="mt-5 w-full bg-[#1F3B2D] text-white font-semibold py-3 rounded-xl">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
