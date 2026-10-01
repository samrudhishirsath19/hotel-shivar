import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import Img from "../components/Img";
import { apiFetch } from "../api";

const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

// Shown only if the backend cannot be reached
const fallbackRooms = [
  {
    name: "Standard Room",
    price: 1800,
    size: "220 sq ft",
    guests: 2,
    image: u("photo-1631049307264-da0ec9d70304"),
    amenities: ["Queen bed", "Free Wi-Fi", "LED TV", "Hot water"],
  },
  {
    name: "Deluxe Room",
    price: 2800,
    size: "280 sq ft",
    guests: 2,
    image: u("photo-1611892440504-42a792e24d32"),
    amenities: ["King bed", "Free Wi-Fi", "Air conditioning", "Tea/coffee maker"],
  },
  {
    name: "Valley View Room",
    price: 3800,
    size: "320 sq ft",
    guests: 3,
    image: u("photo-1590490360182-c33d57733427"),
    amenities: ["Private balcony", "Valley view", "Air conditioning", "Mini fridge"],
  },
  {
    name: "Family Room",
    price: 4800,
    size: "420 sq ft",
    guests: 4,
    image: u("photo-1566665797739-1674de7a421a"),
    amenities: ["2 double beds", "Sofa seating", "Breakfast included", "Smart TV"],
  },
  {
    name: "Executive Suite",
    price: 6200,
    size: "500 sq ft",
    guests: 3,
    image: u("photo-1582719478250-c89cae4dc85b"),
    amenities: ["Separate living area", "Bathtub", "Breakfast included", "Work desk"],
  },
  {
    name: "Presidential Suite",
    price: 8000,
    size: "750 sq ft",
    guests: 4,
    image: u("photo-1578683010236-d716f9a3f461"),
    amenities: ["Panoramic view", "Jacuzzi", "All meals included", "Butler service"],
  },
];

// backend Room -> what this page draws
const toCard = (r) => ({
  id: r.id,
  name: r.name || `Room ${r.roomNumber}`,
  price: Number(r.pricePerNight),
  size: r.size || "",
  guests: r.capacity || 2,
  image: r.imageUrl || u("photo-1631049307264-da0ec9d70304"),
  amenities: (r.amenities || "").split(",").map((a) => a.trim()).filter(Boolean),
});

export default function Rooms({ onBookNow }) {
  const [rooms, setRooms] = useState(null);

  useEffect(() => {
    apiFetch("/api/rooms?availableOnly=true")
      .then((list) => setRooms((list || []).map(toCard)))
      .catch(() => setRooms(fallbackRooms));
  }, []);

  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="Rooms & Suites"
        subtitle="Six ways to stay in the hills — from a cosy standard room to a suite with the whole valley outside your window."
        image={u("photo-1582719478250-c89cae4dc85b")}
      />

      <section className="max-w-7xl mx-auto px-4 py-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {rooms === null && <p className="text-gray-500 col-span-full text-center">Loading rooms...</p>}
        {rooms && rooms.length === 0 && <p className="text-gray-500 col-span-full text-center">No rooms available right now.</p>}
        {(rooms || []).map((room) => (
          <article key={room.id || room.name} className="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col">
            <Img src={room.image} alt={room.name} className="h-56 w-full object-cover" />

            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-2xl text-[#1F3B2D]">{room.name}</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {room.size ? room.size + " · " : ""}Up to {room.guests} guests
              </p>

              <ul className="mt-4 space-y-1.5 text-sm text-gray-700 flex-1">
                {room.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B8893C]" />
                    {a}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between">
                <p>
                  <span className="text-2xl font-semibold text-[#1F3B2D]">
                    ₹{room.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-gray-500"> / night</span>
                </p>
                <button
                  type="button"
                  onClick={() => onBookNow?.(room.name)}
                  className="bg-[#B8893C] hover:bg-[#9E7430] text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  Book Now
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
