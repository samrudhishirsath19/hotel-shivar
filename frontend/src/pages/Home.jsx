import { Link } from "react-router-dom";

const u = (id, w=1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export default function Home({ onBookNow }) {
  return (
    <div className="bg-[#FFFBF5]">
      {/* HERO - No Book Now button here */}
      <div className="relative h-[85vh] w-full overflow-hidden">
        <img src={u("photo-1571896349842-33c89424de2d")} alt="Hotel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <p className="text-[#D9B26A] tracking-[0.3em] text-sm uppercase font-semibold mb-4">Kamshet • Lonavala • Pune</p>
          <h1 className="font-serif text-5xl md:text-7xl text-white font-bold leading-none">
            Hotel Shivar
          </h1>
          <p className="text-white/80 text-lg md:text-xl mt-4 max-w-2xl">A luxury escape in the heart of Sahyadri hills</p>

          <Link to="/rooms" className="mt-8 bg-white text-black px-8 py-3.5 rounded-full font-semibold hover:bg-[#D9B26A] transition-colors">
            Explore Rooms
          </Link>
        </div>
      </div>

      {/* WELCOME SECTION - Fixed */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[#B8893C] text-sm font-bold tracking-widest uppercase">Welcome to</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#1F3B2D] leading-tight mt-3">
            Your Private Retreat in the Sahyadris
          </h2>
          <p className="text-gray-600 leading-relaxed mt-6 text-[15px]">
            Hotel Shivar is not just a stay — it's an experience. Nestled near Rajmachi fort, we offer luxury rooms, authentic Maharashtrian cuisine, and banquet lawns with valley views. Perfect for weddings, getaways, and workations.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-10 border-t border-gray-200 pt-8">
            <div>
              <p className="text-3xl font-serif font-bold text-[#1F3B2D]">24+</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Luxury Rooms</p>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-[#1F3B2D]">3</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Banquet Venues</p>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-[#1F3B2D]">100%</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Valley View</p>
            </div>
          </div>
          <Link to="/about" className="inline-block mt-10 bg-[#1F3B2D] text-white px-7 py-3 rounded-full text-sm font-semibold hover:bg-black">
            Our Story →
          </Link>
        </div>

        <div className="relative">
          <img src={u("photo-1566073771259-6a8506099945", 800)} alt="Hotel" className="rounded-[24px] w-full h-[500px] object-cover shadow-xl" />
          <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-2xl hidden md:block">
            <p className="text-sm font-semibold text-[#1F3B2D]">⭐ 4.8/5 Rated on Google</p>
            <p className="text-xs text-gray-500 mt-1">500+ happy guests</p>
          </div>
        </div>
      </section>
    </div>
  );
}