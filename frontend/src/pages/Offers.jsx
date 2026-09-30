import PageHeader from "../components/PageHeader";
import Img from "../components/Img";

const u = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const offers = [
  {
    title: "Monsoon Escape",
    code: "MONSOON20",
    valid: "Valid till 30 September 2026",
    desc: "20% off room rates when you stay 2 nights or more. Includes breakfast and a guided walk to Tiger's Leap.",
    image: u("photo-1590490360182-c33d57733427"),
  },
  {
    title: "Weekday Getaway",
    code: "WEEKDAY20",
    valid: "Monday to Thursday check-ins",
    desc: "20% off any room for weekday stays, plus late check-out till 2:00 PM on request.",
    image: u("photo-1611892440504-42a792e24d32"),
  },
  {
    title: "Family Holiday",
    code: "FAMILY20",
    valid: "For Family Room and suites",
    desc: "20% off for families of 4. Kids under 8 eat free at Shivar Kitchen.",
    image: u("photo-1566665797739-1674de7a421a"),
  },
];

export default function Offers({ onBookNow }) {
  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="Offers"
        subtitle="Mention the code when you book and we'll apply the discount."
        image={u("photo-1566073771259-6a8506099945", 1600)}
      />

      <section className="max-w-7xl mx-auto px-4 py-16 grid gap-8 md:grid-cols-3">
        {offers.map((o) => (
          <article key={o.code} className="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="relative">
              <Img src={o.image} alt={o.title} className="h-48 w-full object-cover" />
              <span className="absolute top-4 left-4 bg-[#B8893C] text-white font-bold px-3 py-1.5 rounded-md">
                20% OFF
              </span>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h2 className="font-serif text-2xl text-[#1F3B2D]">{o.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{o.valid}</p>
              <p className="text-gray-700 mt-4 flex-1">{o.desc}</p>

              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="border-2 border-dashed border-[#B8893C] text-[#1F3B2D] font-semibold px-3 py-1.5 rounded">
                  {o.code}
                </span>
                <button
                  type="button"
                  onClick={() => onBookNow?.(`${o.title} offer (${o.code})`)}
                  className="bg-[#1F3B2D] hover:bg-[#2C5240] text-white text-sm font-medium px-4 py-2 rounded-md"
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
