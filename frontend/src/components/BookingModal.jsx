import { useState, useEffect } from "react";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = { name: "", phone: "", checkIn: "", checkOut: "", guests: 1 };

export default function BookingModal({ isOpen, onClose, roomName = "" }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // Reset the form every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setError("");
    }
  }, [isOpen]);

  // Close on Escape key + stop background scrolling while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (form.checkOut <= form.checkIn) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    const nights = Math.round(
      (new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24)
    );

    alert(
      `Booking request received!\n\n` +
        `Name: ${form.name}\n` +
        `Phone: ${form.phone}\n` +
        (roomName ? `Room: ${roomName}\n` : "") +
        `Check-in: ${form.checkIn}\n` +
        `Check-out: ${form.checkOut} (${nights} night${nights > 1 ? "s" : ""})\n` +
        `Guests: ${form.guests}\n\n` +
        `Our team will call you shortly to confirm.`
    );
    onClose();
  };

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#B8893C] focus:border-transparent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h2 id="booking-title" className="font-serif text-2xl text-[#1F3B2D]">
              Book your stay
            </h2>
            {roomName && <p className="text-sm text-gray-500 mt-1">{roomName}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Full name</label>
            <input id="name" name="name" required value={form.name} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">Mobile number</label>
            <input
              id="phone" name="phone" type="tel" inputMode="numeric" maxLength={10} required
              placeholder="98XXXXXXXX" value={form.phone} onChange={handleChange} className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="checkIn" className="block text-sm font-medium mb-1">Check-in</label>
              <input
                id="checkIn" name="checkIn" type="date" required min={today()}
                value={form.checkIn} onChange={handleChange} className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="checkOut" className="block text-sm font-medium mb-1">Check-out</label>
              <input
                id="checkOut" name="checkOut" type="date" required min={form.checkIn || today()}
                value={form.checkOut} onChange={handleChange} className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="guests" className="block text-sm font-medium mb-1">Guests</label>
            <select id="guests" name="guests" value={form.guests} onChange={handleChange} className={inputClass}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#1F3B2D] hover:bg-[#2C5240] text-white font-medium py-3 rounded-md"
          >
            Request booking
          </button>
        </form>
      </div>
    </div>
  );
}
