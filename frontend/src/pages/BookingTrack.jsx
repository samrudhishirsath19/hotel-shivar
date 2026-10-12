import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { fmtDateTime } from "../dates";
import { taxOf, inr2, pct } from "../gst";
import OfferApplied from "../components/OfferApplied";

export const BOOKING_STATUS = {
  PENDING: { label: "Received", cls: "bg-amber-100 text-amber-800", note: "We have received your booking. The front desk will confirm it shortly." },
  CONFIRMED: { label: "Confirmed", cls: "bg-green-100 text-green-700", note: "Your room is confirmed. See you soon!" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700", note: "This booking was cancelled. Please call us if this is unexpected." },
};

const fmtDay = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

// Public page for a room booking (the link has the secret tracking code from the confirmation).
export default function BookingTrack() {
  const { code } = useParams();
  const [b, setB] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/bookings/track/${encodeURIComponent(code)}`).then(setB).catch((e) => setError(e.message));
  }, [code]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-red-700">{error}</p>
        <Link to="/account" className="inline-block mt-4 text-[#B8893C] font-semibold">Go to My Account</Link>
      </div>
    );
  }
  if (!b) return <p className="text-center text-gray-500 py-16">Loading your booking...</p>;

  const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.PENDING;
  const t = taxOf(b, "roomCharges");
  const nights = b.nights || Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000);

  return (
    <div className="bg-[#F3F5F1] min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#1F3B2D]">Booking #{b.id}</h1>
            <p className="text-sm text-gray-500">Booked {fmtDateTime(b.createdAt)} · Hotel Shivar, Kamshet</p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${st.cls}`}>{st.label}</span>
        </div>

        <section className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-700">{st.note}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500 text-xs">Check-in</p><p className="font-semibold">{fmtDay(b.checkIn)}</p></div>
            <div><p className="text-gray-500 text-xs">Check-out</p><p className="font-semibold">{fmtDay(b.checkOut)}</p></div>
            <div><p className="text-gray-500 text-xs">Room</p><p className="font-semibold">{b.room?.name} · No. {b.room?.roomNumber}</p></div>
            <div><p className="text-gray-500 text-xs">Guests</p><p className="font-semibold">{b.numberOfGuests} · {nights} night{nights > 1 ? "s" : ""}</p></div>
          </div>
          <p className="text-sm mt-4">👤 {b.guestName} · 📞 {b.phone}</p>
        </section>

        <OfferApplied x={b} />

        <section className="bg-white rounded-2xl border p-5 text-sm space-y-1">
          <h2 className="font-bold text-[#1F3B2D] mb-2">Charges</h2>
          <div className="flex justify-between"><span className="text-gray-600">Room charges</span><span>{inr2(b.roomCharges)}</span></div>
          {b.discountAmount > 0 && (
            <div className="flex justify-between text-green-700"><span>Offer discount{b.offerTitle ? ` - ${b.offerTitle}` : ""} ({b.offerCode})</span><span>- {inr2(b.discountAmount)}</span></div>
          )}
          {t && t.tax > 0 && (
            <div className="flex justify-between text-gray-600"><span>GST {pct(t.rate)} (CGST {inr2(t.cgst)} + SGST {inr2(t.sgst)})</span><span>{inr2(t.tax)}</span></div>
          )}
          <div className="flex justify-between font-bold border-t-2 border-gray-800 pt-1.5 mt-1.5">
            <span>Total{t && t.tax > 0 ? " (incl. GST)" : ""}</span><span className="text-[#B8893C]">{inr2(t ? t.total : b.roomCharges)}</span>
          </div>
          <p className="text-xs text-gray-500 pt-2">Payment is taken at the hotel.</p>
        </section>

        <p className="text-xs text-gray-500 text-center">
          Keep this link to check your booking. Log in to <Link to="/account" className="underline">My Account</Link> to see all your bookings and orders.
        </p>
      </div>
    </div>
  );
}
