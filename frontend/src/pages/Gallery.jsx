import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import Img from "../components/Img";

const u = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const images = [
  { id: "photo-1566073771259-6a8506099945", caption: "Pool at dusk" },
  { id: "photo-1611892440504-42a792e24d32", caption: "Deluxe room" },
  { id: "photo-1414235077428-338989a2e8c0", caption: "Restaurant" },
  { id: "photo-1542314831-068cd1dbfeeb", caption: "Hotel entrance" },
  { id: "photo-1590490360182-c33d57733427", caption: "Valley View room" },
  { id: "photo-1519167758481-83f550bb49b3", caption: "Banquet hall" },
  { id: "photo-1520250497591-112f2f40a3f4", caption: "Garden and pool" },
  { id: "photo-1582719478250-c89cae4dc85b", caption: "Executive Suite" },
  { id: "photo-1517248135467-4c7edcad34c4", caption: "Dining area" },
];

export default function Gallery() {
  const [active, setActive] = useState(null); // index of the open image

  useEffect(() => {
    if (active === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div className="bg-[#F3F5F1]">
      <PageHeader
        title="Gallery"
        subtitle="A look around Hotel Shivar. Tap any photo to see it larger."
        image={u("photo-1520250497591-112f2f40a3f4", 1600)}
      />

      <section className="max-w-7xl mx-auto px-4 py-16 grid gap-4 grid-cols-2 md:grid-cols-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActive(i)}
            className="group relative overflow-hidden rounded-lg aspect-[4/3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8893C]"
          >
            <Img
              src={u(img.id, 600)}
              alt={img.caption}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm text-left px-3 py-2">
              {img.caption}
            </span>
          </button>
        ))}
      </section>

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <figure className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <Img src={u(images[active].id, 1600)} alt={images[active].caption} className="w-full max-h-[80vh] object-contain" />
            <figcaption className="text-white text-center mt-3">{images[active].caption}</figcaption>
          </figure>
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute top-4 right-5 text-white text-4xl leading-none"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
