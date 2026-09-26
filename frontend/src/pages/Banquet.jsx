import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Img from "../components/Img";

const u = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const halls = [
  {
    name: "Sahyadri Grand Hall",
    capacity: 500,
    area: "6,000 sq ft",
    bestFor: "Weddings and receptions",
    image: u("photo-1519167758481-83f550bb49b3"),
    features: ["Stage with LED backdrop", "Bridal room", "In-house catering", "Valet parking"],
  },
  {
    name: "Rajmachi Lawn",
    capacity: 300,
    area: "8,000 sq ft (open-air)",
    bestFor: "Sangeet, haldi and outdoor parties",
    image: u("photo-1511795409834-ef04bbd61622"),
    features: ["Garden setting", "Rain cover available", "DJ and sound setup", "Decor on request"],
  },
  {
    name: "Tungi Conference Room",
    capacity: 80,
    area: "1,400 sq ft",
    bestFor: "Corporate meetings and workshops",
    image: u("photo-1505373877841-8d25f7d46678"),
    features: ["Projector and screen", "High-speed Wi-Fi", "Tea breaks included", "Theatre or U-shape seating"],
  },
];

export default function Banquet() {
  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="Banquets & Events"
        subtitle="Weddings, birthdays and offsites in the Sahyadri hills — with catering from our own kitchen."
        image={u("photo-1464366400600-7168b8af9bc3", 1600)}
      />

      <section className="max-w-6xl mx-auto px-4 py-16 space-y-10">
        {halls.map((hall, i) => (
          <article
            key={hall.name}
            className={`bg-white rounded-lg overflow-hidden shadow-sm grid md:grid-cols-2 ${
              i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <Img src={hall.image} alt={hall.name} className="h-64 md:h-full w-full object-cover" />
            <div className="p-8">
              <h2 className="font-serif text-3xl text-[#1F3B2D]">{hall.name}</h2>
              <p className="text-gray-600 mt-1">{hall.bestFor}</p>

              <div className="flex gap-8 mt-6">
                <div>
                  <p className="text-3xl font-semibold text-[#B8893C]">{hall.capacity}</p>
                  <p className="text-sm text-gray-500">guests</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-[#1F3B2D]">{hall.area.split(" ")[0]}</p>
                  <p className="text-sm text-gray-500">{hall.area.split(" ").slice(1).join(" ")}</p>
                </div>
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-2 text-sm text-gray-700">
                {hall.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B8893C]" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="inline-block mt-8 bg-[#1F3B2D] hover:bg-[#2C5240] text-white text-sm font-medium px-5 py-2.5 rounded-md"
              >
                Enquire about this hall
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
