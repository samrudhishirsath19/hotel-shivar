// <img> with lazy loading and a fallback in case an Unsplash link ever breaks
const FALLBACK =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70";

export default function Img({ src, alt, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(e) => {
        if (e.currentTarget.src !== FALLBACK) e.currentTarget.src = FALLBACK;
      }}
    />
  );
}
