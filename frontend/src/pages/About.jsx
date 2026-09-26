import PageHeader from "../components/PageHeader";
import Img from "../components/Img";

const u = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const stats = [
  { value: "15+", label: "Years of hosting" },
  { value: "48", label: "Rooms and suites" },
  { value: "25,000+", label: "Happy guests" },
  { value: "4.6/5", label: "Average guest rating" },
];

export default function About() {
  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="About Hotel Shivar"
        subtitle="A family-run hill hotel in Lonavala since 2010."
        image={u("photo-1542314831-068cd1dbfeeb", 1600)}
      />

      <section className="max-w-6xl mx-auto px-4 py-16 grid gap-12 md:grid-cols-2 items-center">
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <h2 className="font-serif text-3xl text-[#1F3B2D]">Our story</h2>
          <p>
            Hotel Shivar began in 2010 as a twelve-room guesthouse on the old Mumbai–Pune highway.
            The name comes from the Marathi word for the open fields at the edge of a village —
            the kind of view our first guests woke up to every morning.
          </p>
          <p>
            Fifteen years on, we have 48 rooms, a restaurant, three event spaces and a pool, but
            the idea hasn't changed: a clean, comfortable room, honest home-style food, and staff
            who remember your name.
          </p>
          <p>
            We're a short drive from Bhushi Dam, Tiger's Leap and Karla Caves, and our front desk
            is always happy to plan your day out.
          </p>
        </div>
        <Img
          src={u("photo-1520250497591-112f2f40a3f4")}
          alt="Hotel Shivar garden and pool"
          className="rounded-lg shadow-sm w-full h-80 object-cover"
        />
      </section>

      <section className="bg-[#1F3B2D]">
        <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-serif text-4xl text-[#D9B26A]">{s.value}</p>
              <p className="text-white/80 mt-1 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
