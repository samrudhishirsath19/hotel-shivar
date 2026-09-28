import { useState } from "react";

export default function BookingModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: "", mobile: "", checkIn: "", checkOut: "", guests: "1 guest" });
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleBooking = () => {
    if (!form.name ||!form.mobile) {
      alert("Please fill the details!");
      return;
    }

    setDone(true);

    // Demo sathi local save
    const allBookings = JSON.parse(localStorage.getItem("shivar_bookings") || "[]");
    allBookings.push({...form, date: new Date().toISOString() });
    localStorage.setItem("shivar_bookings", JSON.stringify(allBookings));

    setTimeout(() => {
      onClose();
      setDone(false);
      setForm({ name: "", mobile: "", checkIn: "", checkOut: "", guests: "1 guest" });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white w-full md:max-w-lg rounded-t-[24px] md:rounded-2xl shadow-2xl p-6 md:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">✕</button>

        {!done? (
          <>
            <h2 className="font-serif text-2xl text-[#1F3B2D]">Book your stay</h2>
            <p className="text-sm text-gray-500">Hotel Shivar, Kamshet</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Your name" className="mt-1 w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium">Mobile number</label>
                <input value={form.mobile} onChange={e=>setForm({...form, mobile:e.target.value})} placeholder="98XXXXXXXX" className="mt-1 w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Check-in</label>
                  <input type="date" value={form.checkIn} onChange={e=>setForm({...form, checkIn:e.target.value})} className="mt-1 w-full border rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Check-out</label>
                  <input type="date" value={form.checkOut} onChange={e=>setForm({...form, checkOut:e.target.value})} className="mt-1 w-full border rounded-xl px-4 py-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Guests</label>
                <select value={form.guests} onChange={e=>setForm({...form, guests:e.target.value})} className="mt-1 w-full border rounded-xl px-4 py-3 text-sm bg-white">
                  <option>1 guest</option>
                  <option>2 guests</option>
                  <option>3 guests</option>
                  <option>4+ guests</option>
                </select>
              </div>

              <button onClick={handleBooking} className="w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black">
                Request booking
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
            <h3 className="font-serif text-2xl text-[#1F3B2D] mt-4">Booking Sent!</h3>
            <p className="text-sm text-gray-500 mt-2">Hotel will contact you soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}