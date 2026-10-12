import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { digits10 } from "../roles";
import { apiFetch } from "../api";

const u = (id, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const emptyForm = { name: "", email: "", phone: "", subject: "Room booking", message: "" };

export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.name === "phone" ? digits10(e.target.value) : e.target.value });

  // saved on the server - staff see it on the dashboard's Enquiries page
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSent("");
    setBusy(true);
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
      });
      setSent(`Thank you, ${form.name.trim()}! We've received your message and will reply within 24 hours.`);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8893C] focus:border-transparent";

  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="Contact us"
        subtitle="Questions about rooms, events or directions? Write to us or call the front desk."
        image={u("photo-1542314831-068cd1dbfeeb")}
      />

      <section className="max-w-6xl mx-auto px-4 py-16 grid gap-10 lg:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6 md:p-8 space-y-4">
          <h2 className="font-serif text-2xl text-[#1F3B2D] mb-2">Send a message</h2>
          {sent && <p role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{sent}</p>}
          {error && <p role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-name" className="block text-sm font-medium mb-1">Full name</label>
              <input id="c-name" name="name" required value={form.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="c-phone" className="block text-sm font-medium mb-1">Mobile number</label>
              <input
                id="c-phone" name="phone" type="tel" pattern="[0-9]{10}" title="Phone number must be exactly 10 digits" inputMode="numeric"
                required value={form.phone} onChange={handleChange} className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="c-email" className="block text-sm font-medium mb-1">Email</label>
            <input id="c-email" name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="c-subject" className="block text-sm font-medium mb-1">What's this about?</label>
            <select id="c-subject" name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
              <option>Room booking</option>
              <option>Banquet / event enquiry</option>
              <option>Restaurant reservation</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="c-message" className="block text-sm font-medium mb-1">Message</label>
            <textarea id="c-message" name="message" rows={5} required value={form.message} onChange={handleChange} className={inputClass} />
          </div>

          <button type="submit" disabled={busy} className="bg-[#1F3B2D] hover:bg-[#2C5240] text-white font-medium px-6 py-3 rounded-md disabled:opacity-60">
            {busy ? "Sending..." : "Send message"}
          </button>
        </form>

        {/* Address + map */}
        <aside className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 text-gray-700">
            <h2 className="font-serif text-2xl text-[#1F3B2D]">Hotel Shivar</h2>
            <p>
              Old Mumbai–Pune Highway,<br />
              Near Lonavala Bus Stand,<br />
              Lonavala, Maharashtra 410401
            </p>
            <p>
              <span className="block text-sm text-gray-500">Front desk</span>
              <a href="tel:+919876543210" className="hover:text-[#B8893C]">+91 98765 43210</a>
            </p>
            <p>
              <span className="block text-sm text-gray-500">Email</span>
              <a href="mailto:stay@hotelshivar.com" className="hover:text-[#B8893C]">stay@hotelshivar.com</a>
            </p>
            <p>
              <span className="block text-sm text-gray-500">Check-in / Check-out</span>
              12:00 PM / 11:00 AM
            </p>
          </div>

          <iframe
            title="Hotel Shivar location"
            src="https://www.google.com/maps?q=Lonavala,Maharashtra&output=embed"
            className="w-full h-64 rounded-lg border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </aside>
      </section>
    </div>
  );
}
