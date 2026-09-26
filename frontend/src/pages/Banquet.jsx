import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Img from "../components/Img";

const u = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const halls = [
  {
    name: "Sahyadri Grand Hall",
    capacity: 500,
    area: "6,000 sq ft",
    bestFor: "Weddings and Receptions",
    image: u("photo-1519167758481-83f550bb49b3"),
    features: ["Stage with LED backdrop", "Bridal room", "In-house catering", "Valet parking"],
  },
  {
    name: "Rajhans Lawn",
    capacity: 300,
    area: "8,000 sq ft Open",
    bestFor: "Sangeet, Haldi & Outdoor Parties",
    image: u("photo-1511795409834-ef04bbd61622"),
    features: ["Garden setting", "Rain cover available", "DJ and sound setup", "Decor on request"],
  },
  {
    name: "Heritage Conference Room",
    capacity: 80,
    area: "1,400 sq ft",
    bestFor: "Corporate Meetings & Workshops",
    image: u("photo-1505373877841-8d25f7d46678"),
    features: ["Projector and screen", "High-speed Wi-Fi", "Tea breaks included", "Theatre seating"],
  },
];

export default function Banquet() {
  return (
    <div className="bg-[#F3F5F1] min-h-screen">
      <PageHeader
        title="Banquets & Events"
        subtitle="Weddings, birthdays and offsites in the Sahyadri hills — with catering from our own kitchen."
        image={u("photo-1464366400600-7168b8af9bc3", 1600)}
      />

      <section className="max-w-6xl mx-auto px-4 py-16 space-y-12">
        {halls.map((hall, i) => (
          <article
            key={hall.name}
            className={`bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] grid md:grid-cols-2 ${
              i % 2 === 1? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <Img src={hall.image} alt={hall.name} className="h-72 md:h-full w-full object-cover" />
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <h2 className="font-serif text-3xl md:text-[32px] text-[#1F3B2D] tracking-tight">{hall.name}</h2>
              <p className="text-[#B8893C] font-medium mt-2 text-[15px]">{hall.bestFor}</p>

              <div className="flex gap-10 mt-8">
                <div>
                  <p className="text-4xl font-serif font-semibold text-[#B8893C]">{hall.capacity}</p>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Max Guests</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div>
                  <p className="text-4xl font-serif font-semibold text-[#1F3B2D]">{hall.area}</p>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Total Area</p>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-7" />

              <ul className="grid grid-cols-2 gap-3 text-[14px] text-gray-700">
                {hall.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#B8893C] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="inline-block mt-8 bg-[#1F3B2D] hover:bg-[#2C5240] text-white text-sm font-semibold tracking-wide px-6 py-3 rounded-full w-fit transition-colors"
              >
                Enquire about this hall →
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}