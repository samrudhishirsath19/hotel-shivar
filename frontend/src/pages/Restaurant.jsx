import PageHeader from "../components/PageHeader";
import Img from "../components/Img";

const u = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const dishes = [
  {
    name: "Paneer Tikka",
    price: 320,
    veg: true,
    desc: "Cottage cheese marinated in hung curd and spices, charred in the tandoor.",
    image: u("photo-1567188040759-fb8a883dc6d8"),
  },
  {
    name: "Hyderabadi Chicken Biryani",
    price: 420,
    veg: false,
    desc: "Slow-cooked dum biryani with saffron rice, served with raita and salan.",
    image: u("photo-1589302168068-964664d93dc0"),
  },
  {
    name: "Butter Chicken",
    price: 380,
    veg: false,
    desc: "Tandoori chicken in a smooth tomato, butter and cream gravy.",
    image: u("photo-1565557623262-b51c2513a641"),
  },
  {
    name: "Dal Makhani",
    price: 260,
    veg: true,
    desc: "Black lentils simmered overnight with butter — best with garlic naan.",
    image: u("photo-1546833999-b9f581a1996d"),
  },
  {
    name: "Samosa Chaat",
    price: 150,
    veg: true,
    desc: "Crushed samosa with chole, curd, tamarind and mint chutney.",
    image: u("photo-1601050690597-df0568f70950"),
  },
  {
    name: "Lonavala Chikki Kulfi",
    price: 180,
    veg: true,
    desc: "House-made malai kulfi topped with crushed peanut chikki from the local market.",
    image: u("photo-1488900128323-21503983a07e"),
  },
];

const VegMark = ({ veg }) => (
  <span
    title={veg ? "Vegetarian" : "Non-vegetarian"}
    className={`inline-flex items-center justify-center h-4 w-4 border-2 ${veg ? "border-green-600" : "border-red-700"}`}
  >
    <span className={`h-2 w-2 rounded-full ${veg ? "bg-green-600" : "bg-red-700"}`} />
  </span>
);

export default function Restaurant() {
  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="Shivar Kitchen"
        subtitle="North Indian and Maharashtrian favourites, served all day. Open 7:00 AM – 11:00 PM."
        image={u("photo-1414235077428-338989a2e8c0", 1600)}
      />

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl text-[#1F3B2D] mb-8">Chef's picks</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {dishes.map((d) => (
            <article key={d.name} className="bg-white rounded-lg overflow-hidden shadow-sm flex">
              <Img src={d.image} alt={d.name} className="w-32 sm:w-40 h-auto object-cover flex-shrink-0" />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-xl text-[#1F3B2D] flex items-center gap-2">
                    <VegMark veg={d.veg} />
                    {d.name}
                  </h3>
                  <span className="font-semibold text-[#B8893C] whitespace-nowrap">₹{d.price}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{d.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Prices are inclusive of GST. Room service available 24 hours for in-house guests.
        </p>
      </section>
    </div>
  );
}
