// Reusable banner used at the top of every inner page
export default function PageHeader({ title, subtitle, image }) {
  return (
    <section
      className="relative h-64 md:h-80 flex items-end bg-cover bg-center bg-[#1F3B2D]"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F3B2D]/90 to-[#1F3B2D]/20" />
      <div className="relative max-w-7xl w-full mx-auto px-4 pb-10">
        <h1 className="font-serif text-4xl md:text-5xl text-white">{title}</h1>
        {subtitle && <p className="text-white/85 mt-2 max-w-xl">{subtitle}</p>}
      </div>
    </section>
  );
}
